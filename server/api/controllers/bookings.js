const Booking = require('../../models/booking');
const ApplicationError = require('../../errors/applicationErrors');
const Event = require('../../models/event');

exports.getBookings = (req, res, next) => {
  res.status(200).send('Get bookings');
};

exports.createBooking = (req, res, next) => {
  const bookingRequest = req.body;
  let events = bookingRequest.events;

  events.forEach(event => {
    event.clientContact = bookingRequest.client;
  });
  
  Booking.validateEvents(events)
    .then(validatedEvents => {
      return Event.checkClashes([...validatedEvents]);
    })
    .then(clashes => {
      if (clashes.length > 0) {
        const error = new ApplicationError.EventDateTimeClash();
        error.events = clashes;
        throw error;
      } else {
        return Event.saveEventArray(validatedEvents);
      }
    })
    .then((savedEvents) => {
      bookingRequest.events = savedEvents.map(event => {
        return event._id;
      });
      const booking = new Booking(bookingRequest);
      return booking.save();
    })
    .then(result => {
      console.log(result);
      res.status(201).send(result);
    })
    .catch(e => {
      return next(e);
    })

  // try {
  //   const validatedEvents = Booking.validateEvents(bookingRequest.events);
  //   // console.log('ValidatedEvents: ', validatedEvents);
  //   Event.checkClashes(validatedEvents)
  //     .then(clashes => {
  //       console.log('clashEvents: ', clashes);
  //       if (clashes.length > 0) {
  //         const error = new ApplicationError.EventDateTimeClash();
  //         error.events = clashes;
  //         throw error;
  //       } else {
  //         Event.saveEventArray(validatedEvents)
  //           .then(res => {
  //             console.log('Array of events saved');
  //             console.log(res);
  //           })
  //           .catch(e => {
  //             console.log(e);
  //           })
  //       }
  //     })
  //     .catch(e => {
  //       console.log('e: ', e);
  //     })
  // } catch(e) {
  //   console.log('An error occurred');
  //   return next(e);
  // }

};