const expect = require('expect');
const request = require('supertest');

const { app } = require('../../server');
const Event = require('../../models/event');
const ApplicationError = require('../../errors/applicationErrors');

const { populateEvents, populateUsers } = require('../seed/seed');

describe('Events UPDATE', () => {
  
  let users;
  let events;
  let superAdmin;
  let admin;

  beforeEach(done => {
    Promise.all([populateUsers(), populateEvents()])
      .then(res => {
        users = res[0];
        events = res[1];
        superAdmin = users.find(user => user.role === 'super-admin');
        admin = users.find(user => user.role === 'admin');
        done();
      })
      .catch(e => done(e));
  });
  
  it('should not allow an unauthenticated user to update events', (done) => {
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
  });

  it('should allow an authenticated user to update events', (done) => {
    const eventOne = events[0];

    const update = {
      title: 'something new'
    };

    request(app)
      .patch(`/events/${eventOne._id}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .send(update)
      .expect(200)
      .end(err => {
        if (err) return done(err);
        Event.findById(eventOne._id)
          .then(event => {
            expect(event.title).not.toEqual(eventOne.title);
            done();
          })
          .catch(e => {
            done(e);
          })
      });
  })

  it('should return a 400 error for an invalid event id', (done) => {
    const error = new ApplicationError.InvalidObjectID();

    const eventOneId = events[0]._id + 'a';

    request(app)
      .patch(`/events/${eventOneId}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
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
      .patch(`/events/${invalidID}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  });

  it('should not allow an event to be edited to identically clash with another event', (done) => {
    const error = new ApplicationError.EventDateTimeClash();
    const eventOneId = events[0]._id;
    const edit = {
      startDateTime: events[1].startDateTime,
      endDateTime: events[1].endDateTime
    }

    request(app)
      .patch(`/events/${eventOneId}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .send(edit)
      .expect(400)
      .expect(res => {
        expect(res.body.events.length).toBeGreaterThan(0);
        expect(res.body.events).not.toContainEqual({
          _id: eventOneId
        });
        expect(res.body.name).toEqual(error.name);
      })
      .end(done)
  });

  it('should not allow an event to be edited to clash with first portion of another event', (done) => {
    const error = new ApplicationError.EventDateTimeClash();
    const eventOneId = events[0]._id;
    const edit = {
      startDateTime: events[1].startDateTime - (1800 * 1000),
      endDateTime: events[1].endDateTime - (1800 * 1000)
    }

    request(app)
      .patch(`/events/${eventOneId}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .send(edit)
      .expect(400)
      .expect(res => {
        expect(res.body.events.length).toBeGreaterThan(0);
        expect(res.body.events).not.toContainEqual({
          _id: eventOneId
        });
        expect(res.body.name).toEqual(error.name);
      })
      .end(done)
  });

  it('should not allow an event to be edited to clash with later portion of another event', (done) => {
    const error = new ApplicationError.EventDateTimeClash();
    const eventOneId = events[0]._id;
    const edit = {
      startDateTime: events[1].startDateTime + (1800 * 1000),
      endDateTime: events[1].endDateTime + (1800 * 1000)
    }

    request(app)
      .patch(`/events/${eventOneId}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .send(edit)
      .expect(400)
      .expect(res => {
        expect(res.body.events.length).toBeGreaterThan(0);
        expect(res.body.events).not.toContainEqual({
          _id: eventOneId
        });
        expect(res.body.name).toEqual(error.name);
      })
      .end(done)
  });

  it('should not allow an event to be edited to clash inside of another event', (done) => {
    const error = new ApplicationError.EventDateTimeClash();
    const eventOneId = events[0]._id;
    const edit = {
      startDateTime: events[1].startDateTime + (900 * 1000),
      endDateTime: events[1].endDateTime - (900 * 1000)
    }

    request(app)
      .patch(`/events/${eventOneId}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .send(edit)
      .expect(400)
      .expect(res => {
        expect(res.body.events.length).toBeGreaterThan(0);
        expect(res.body.events).not.toContainEqual({
          _id: eventOneId
        });
        expect(res.body.name).toEqual(error.name);
      })
      .end(done)
  });

  it('should not allow an event to be edited to clash outside of another event\'s start and end times', (done) => {
    const error = new ApplicationError.EventDateTimeClash();
    const eventOneId = events[0]._id;
    const edit = {
      startDateTime: events[1].startDateTime - (900 * 1000),
      endDateTime: events[1].endDateTime + (900 * 1000)
    }

    request(app)
      .patch(`/events/${eventOneId}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .send(edit)
      .expect(400)
      .expect(res => {
        expect(res.body.events.length).toBeGreaterThan(0);
        expect(res.body.events).not.toContainEqual({
          _id: eventOneId
        });
        expect(res.body.name).toEqual(error.name);
      })
      .end(done)
  });
});