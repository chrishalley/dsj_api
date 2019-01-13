const expect = require('expect');
const request = require('supertest');

const Booking = require('../models/booking');
const ApplicationError = require('../errors/applicationErrors');
const {app} = require('../server');
const {populateBookings} = require('./seed/seed.js');


before(populateBookings);

describe('POST /bookings', () => {

  it('should not allow a booking to be created with events array length 0', (done) => {
    const bookingRequest = {
      client: 'Test Testison',
      events: []
    }

    request(app)
      .post('/bookings')
      .send(bookingRequest)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual('Booking must have at least one event');
      })
      .end(done);
  });

  it('should not allow a booking to be created with invalid event objects', (done) => {
    const error = new ApplicationError.BookingInvalid();

    const bookingRequest = {
      client: 'Test Testison',
      events: ['Event One']
    };

    request(app)
      .post('/bookings')
      .send(bookingRequest)
      .expect(400)
      .expect(res => {
        expect(res.body.name).toEqual(error.name);
      })
      .end(done);
  });

  it('should allow a booking to be created with a valid event object', (done) => {
    const bookingRequest = {
      client: 'Test Testison',
      events: [
        {
          title: 'Valid event',
          description: 'Valid event description',
          startDateTime: new Date().getTime() + (7 * 3600 * 1000),
          endDateTime: new Date().getTime() + (8 * 3600 * 1000)
        }
      ]
    };

    request(app)
      .post('/bookings')
      .send(bookingRequest)
      .expect(201)
      .expect(res => {
        console.log('RES: ', res.body);
      })
      .end(done);
  });

  it('should return an error for bookings containing events with times that clash', (done) => {
    const bookingRequest = {
      client: 'Test Testison',
      events: [
        {
          title: 'Clash event one',
          description: 'Start time +1hr / end time +2hr',
          startDateTime: new Date().getTime() + (3600 * 1000),
          endDateTime: new Date().getTime() + (2 * 3600 * 1000),
          clientContact: this.client
        },
        {
          title: 'Clash event two',
          description: 'Start time +1.5hr / end time +2.5hr',
          startDateTime: new Date().getTime() + (1.5 * 3600 * 1000),
          endDateTime: new Date().getTime() + (2.5 * 3600 * 1000),
          clientContact: this.client
        },
        {
          title: 'Clash event three',
          description: 'Start time +4hr / end time +6hr',
          startDateTime: new Date().getTime() + (4 * 3600 * 1000),
          endDateTime: new Date().getTime() + (6 * 3600 * 1000),
          clientContact: this.client
        }
      ]
    };

    request(app)
      .post('/bookings')
      .send(bookingRequest)
      .expect(400)
      .expect(res => {
        expect(res.body.events[0].length).toBe(3);
        expect(res.body.events[0][0].title).toEqual(bookingRequest.events[0].title);
        expect(res.body.events[1].length).toBe(2);
        expect(res.body.events[1][0].title).toEqual(bookingRequest.events[1].title);
        expect(res.body.events[2].length).toBe(2);
        expect(res.body.events[2][0].title).toEqual(bookingRequest.events[2].title);
      })
      .end(done);
  })

  it('Bookings with one event should be permitted', (done) => {
    const bookingRequest = {
      client: 'Test Testison',
      events: [
        {
          title: 'Non-clashing event one',
          description: 'Start time +1hr / end time +2hr',
          startDateTime: new Date().getTime() + (  10 * 3600 * 1000),
          endDateTime: new Date().getTime() + (11 * 3600 * 1000),
          clientContact: this.client
        }
      ]
    };

    request(app)
      .post('/bookings')
      .send(bookingRequest)
      .expect(201)
      .expect(res => {
        // console.log(res);
      })
      .end(done);

  });

  it('should save multiple valid events with non-clashing times', (done) => {
    const bookingRequest = {
      client: 'Test Testison',
      events: [
        {
          title: 'Non-Clashing event one',
          description: 'Start time +15hr / end time +16hr',
          startDateTime: new Date().getTime() + (15 * 3600 * 1000),
          endDateTime: new Date().getTime() + (16 * 3600 * 1000),
          clientContact: this.client
        },
        {
          title: 'Non-Clashing event two',
          description: 'Start time +17hr / end time +18hr',
          startDateTime: new Date().getTime() + (17 * 3600 * 1000),
          endDateTime: new Date().getTime() + (18 * 3600 * 1000),
          clientContact: this.client
        },
        {
          title: 'Non-Clashing event three',
          description: 'Start time +19hr / end time +21hr',
          startDateTime: new Date().getTime() + (19 * 3600 * 1000),
          endDateTime: new Date().getTime() + (21 * 3600 * 1000),
          clientContact: this.client
        }
      ]
    };

    request(app)
      .post('/bookings')
      .send(bookingRequest)
      .expect(201)
      .expect(res => {
        expect(res.body.events.length).toEqual(bookingRequest.events.length);
      })
      .end(done);
  })

});