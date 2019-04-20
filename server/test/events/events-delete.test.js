const expect = require('expect');
const request = require('supertest');

const { app } = require('../../server');
const Event = require('../../models/event');
const User = require('../../models/user');
const ApplicationError = require('../../errors/applicationErrors');
const { populateEvents, populateUsers } = require('../seed/seed');


describe('Events DELETE', () => {
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
      .catch(e => {
        console.error('beforeEach() error:', e);
        done(e);
      })
  });

  it('should not allow an unauthenticated user to delete an event', (done) => {
    const eventOneId = events[0]._id;
    request(app)
      .delete(`/events/${eventOneId}`)
      .expect(401)
      .end(err => {
        if (err) return done(err);
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
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .expect(200)
      .expect(res => {
        expect(res.body._id.toString()).toEqual(eventOneId.toString());
      })
      .end(err => {
        if (err) return done(err);
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
      .delete(`/events/${invalidID}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  })
})