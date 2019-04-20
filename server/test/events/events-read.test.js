const expect = require('expect');
const request = require('supertest');

const { app } = require('../../server');
const { events, populateEvents, populateUsers, getTokens } = require('../seed/seed');
const ApplicationError = require('../../errors/applicationErrors');

describe('Events READ', () => {

  let users;
  let events;
  let superAdmin;
  let admin;

  beforeEach(done => {
    Promise.all([populateUsers(), populateEvents()])
      .then(res => {
        users = res[0];
        events = res[1];
        done();
      })
      .catch(e => done(e));
  });

  it('should allow unauthenticated users to get an array of all events', (done) => {
    request(app)
      .get('/events')
      .expect(200)
      .expect(res => {
        expect(res.body.length).toEqual(events.length);
      })
      .end(done);
  });

  it('should allow unauthenticated users to get a single event by id', (done) => {
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
  });

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
})