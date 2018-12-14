const expect = require('expect');
const request = require('supertest');
const {app} = require('../server');
const {populateEvents, events, populateUsers, users, getTokens} = require('./seed/seed');
const Event = require('../models/event');
const User = require('../models/user');
const ApplicationError = require('../errors/applicationErrors');

let tokens;

before(populateUsers)
before(async () => {
  tokens = await getTokens();
});
before(populateEvents);

describe('GET /events', () => {
  it('should allow unauthenticated users to get an array of all events', (done) => {
    request(app)
      .get('/events')
      .expect(200)
      .expect(res => {
        expect(res.body.length).toEqual(events.length);
      })
      .end(done);
  });
});

describe('GET /events/:id', (done) => {
  it('should allow unauthenticated users to get a single event', (done) => {
    const eventOne = events[0];
    request(app)
      .get(`/events/${eventOne._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body._id.toString()).toEqual(eventOne._id.toString());
        expect(res.body.title).toEqual(eventOne.title);
      })
      .end(done);
  });

  it('should return a 400 error for an invalid event id', (done) => {
    const error = new ApplicationError.InvalidObjectID();

    const invalidID = events[0]._id + 'a';
    request(app)
      .get(`/events/${invalidID}`)
      .expect(400)
      .expect(res => {
        expect(res.body.name).toEqual(error.name);
      })
      .end(done);
  })
  
  it('should return a 404 error for a non-existent event id', (done) => {
    const error = new ApplicationError.EventNotFound();

    const nonID = events[0]._id.toString().split('').reverse().join('');

    request(app)
      .get(`/events/${nonID}`)
      .expect(404)
      .expect(res => {
        expect(res.body.name).toEqual(error.name);
      })
      .end(done);
  })


});

describe('POST /events', () => {
  it('should allow unauthenticated users to create events', (done => {
    const event = {
      title: 'EventTitle',
      description: 'EventDesc',
      startDateTime: new Date().getTime() + (3600 * 1000 * 24),
      endDateTime: new Date().getTime() + (3600 * 1000 * 28)
    };

    request(app)
      .post('/events')
      .send(event)
      .expect(201)
      .expect(res => {
        expect(res.body.title).toEqual(event.title)
      })
      .end(done)
  }));

  it('should not allow an event to start in the past', (done) => {
    const event = {
      title: 'EventTitle',
      description: 'EventDesc',
      startDateTime: new Date().getTime() - 3600,
      endDateTime: new Date().getTime() + 3600
    };

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual('Start date or time has already passed');
      })
      .end(done)
  })
  
  it('should not allow an event to end in the past', (done) => {
    const event = {
      title: 'EventTitle',
      description: 'EventDesc',
      startDateTime: new Date().getTime() + 3600,
      endDateTime: new Date().getTime() - 3600
    };

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual('End date or time has already passed');
      })
      .end(done)
  })
  
  it('should not allow an event\'s endDateTime to be less than it\'s startDateTime', (done) => {
    const event = {
      title: 'EventTitle',
      description: 'EventDesc',
      startDateTime: new Date().getTime() + 7200,
      endDateTime: new Date().getTime() + 3600
    };

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual('End date or time is earlier than start date or time');
      })
      .end(done)
  })
  
  it('should not allow an event\'s endDateTime to be less than it\'s startDateTime', (done) => {
    const event = {
      title: 'EventTitle',
      description: 'EventDesc',
      startDateTime: new Date().getTime() + 7200,
      endDateTime: new Date().getTime() + 3600
    };

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual('End date or time is earlier than start date or time');
      })
      .end(done)
  })

  it('should not allow an event to start during another event', (done) => {
    const event = new Event({ // Should clash with Event One
      title: 'Clash Event',
      description: 'Start time +1.5hr / end time +2.5hr',
      startDateTime: new Date().getTime() + (1.5 * 3600 * 1000),
      endDateTime: new Date().getTime() + (2.5 * 3600 * 1000),
    });

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.error).toBeTruthy();
        expect(res.body.events.length).toBeGreaterThan(0);
      })
      .end(done);
  })

  it('should not allow an event to end during another event', (done) => {
    const event = new Event({ // Should clash with Event One
      title: 'Clash Event',
      description: 'Start time +0.5hr / end time +1.5hr',
      startDateTime: new Date().getTime() + (0.5 * 3600 * 1000),
      endDateTime: new Date().getTime() + (1.5 * 3600 * 1000),
    });

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.error).toBeTruthy();
        expect(res.body.events.length).toBeGreaterThan(0);
      })
      .end(done);
  })

  it('should not allow an event to start before and end after another event', (done) => {
    const event = new Event({ // Should clash with Event One
      title: 'Clash Event',
      description: 'Start time +0.5hr / end time +2.5hr',
      startDateTime: new Date().getTime() + (0.5 * 3600 * 1000),
      endDateTime: new Date().getTime() + (2.5 * 3600 * 1000),
    });

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.error).toBeTruthy();
        expect(res.body.events.length).toBeGreaterThan(0);
      })
      .end(done);
  })
  
  it('should not allow an event to start after another event begins and end before that event ends', (done) => {
    const event = new Event({ // Should clash with Event One
      title: 'Clash Event',
      description: 'Start time +1.25hr / end time +1.75hr',
      startDateTime: new Date().getTime() + (1.25 * 3600 * 1000),
      endDateTime: new Date().getTime() + (1.75 * 3600 * 1000),
    });

    request(app)
      .post('/events')
      .send(event)
      .expect(400)
      .expect(res => {
        expect(res.error).toBeTruthy();
        expect(res.body.events.length).toBeGreaterThan(0);
      })
      .end(done);
  })
});

describe('PATCH /events/:id', () => {

  it ('should not allow an unauthenticated user to update events', (done) => {
    const eventOne = events[0];
    const update = {
      title: 'something new'
    };

    const error = new ApplicationError.UserUnauthenticated();

    request(app)
      .patch(`/events/${eventOne._id}`)
      .send(update)
      .expect(401)
      .expect(res => {
        expect(res.body.name).toEqual(error.name);
      })
      .end(done);
  })

  it('should allow an authenticated user to update events', (done) => {
    const eventOne = events[0];
    console.log('eventOne: ', eventOne);

    const update = {
      title: 'something new'
    };

    request(app)
      .patch(`/events/${eventOne._id}`)
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send(update)
      .expect(200)
      .expect(res => {
        expect(res.body.name).toEqual(error.name);
      })
      .end(() => {
        Event.findById(eventOne._id)
          .then(event => {
            console.log('EVENT: ', event);
            expect(event.title).not.toEqual(eventOne.title);
            done();
          })
          .catch(e => {
            console.log(e)
            done(e);
          })
      });
  })

  it('should return a 400 error for an invalid event id', (done) => {
    const error = new ApplicationError.InvalidObjectID();

    const eventOneId = events[0]._id + 'a';

    request(app)
      .delete(`/events/${eventOneId}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  })

  it('should return a 404 error for an non-existent event id', (done) => {
    const error = new ApplicationError.EventNotFound();

    const invalidID = events[0]._id.toHexString().split('').reverse().join('');

    request(app)
      .delete(`/events/${invalidID}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  });
});

describe('DELETE /events/:id', () => {
  
  it('should not allow an unauthenticated user to delete an event', (done) => {
    const eventOneId = events[0]._id;

    request(app)
      .delete(`/events/${eventOneId}`)
      .expect(403)
      .end(() => {
        Event.findById(eventOneId)
          .then(event => {
            expect(event).toBeTruthy();
            expect(event._id).toEqual(eventOneId);
            done();
          })
          .catch(e => {
            done(e);
          });
      })
  })
 
  it('should allow an authenticated user to delete an event', (done) => {
    const eventOneId = events[0]._id;

    request(app)
      .delete(`/events/${eventOneId}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toEqual(eventOneId)
      })
      .end(() => {
        Event.findById(eventOneId)
          .then(event => {
            expect(event).toBe(null);
            done();
          })
          .catch(e => {
            done(e);
          });
      })
  })

  it('should return a 400 error for an invalid event id', (done) => {
    const error = new ApplicationError.InvalidObjectID();

    const eventOneId = events[0]._id + 'a';

    request(app)
      .delete(`/events/${eventOneId}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  })

  it('should return a 404 error for an non-existent event id', (done) => {
    const error = new ApplicationError.EventNotFound();

    const invalidID = events[0]._id.toHexString().split('').reverse().join('');

    request(app)
      .delete(`/events/${invalidID}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  })
})

