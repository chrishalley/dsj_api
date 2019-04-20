const expect = require('expect');
const request = require('supertest');

const { app } = require('../../server');
const Event = require('../../models/event');
const ApplicationError = require('../../errors/applicationErrors');
const { populateEvents, populateUsers } = require('../seed/seed');
const User = require('../../models/user');


describe('Events CREATE', () => {

  let users;
  let events;

  beforeEach(done => {
    
    Promise.all([populateUsers(), populateEvents()])
      .then(res => {
        users = res[0];
        events = res[1];
        done();
      })
      .catch(e => {
        console.error('beforeEach() error:', e);
        done(e);
      });
  });

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
      .end(err => {
        if (err) return done(err);
        Event.find({title: event.title})
          .then(events => {
            expect(events.length).toEqual(1);
            expect(events[0].startDateTime).toEqual(event.startDateTime.toString());
            done();
          })
          .catch(e => done(e))
      })
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
  });

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
  });

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
  });

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
        expect(res.body.events[0]._id.toString()).toEqual(events[0]._id.toString());
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
        expect(res.body.events[0]._id.toString()).toEqual(events[0]._id.toString());
      })
      .end(done);
  });

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
        expect(res.body.events[0]._id.toString()).toEqual(events[0]._id.toString());
      })
      .end(done);
  });

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
        expect(res.body.events[0]._id.toString()).toEqual(events[0]._id.toString());
      })
      .end(done);
  });
})