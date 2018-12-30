const mongoose = require('mongoose');
const Event = require('./event');

const ApplicationError = require('../errors/applicationErrors');

var BookingSchema = new mongoose.Schema({
  client: {
    type: String,
    required: true,
    default: 'John Smith'
  },
  events: {
      type: [{
        type: String,
      }],
      // type: [{
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: 'Event'
      // }],
      validate: {
        validator: function(array) {
          return array.length > 0;
        },
        message: () => {
          return `Booking must have at least one event`;
        }
      }
    },
  progress: {
    type: Object,
    // required: true,
    default: {
      requested: true,
      pending: false,
      confirmed: false
    }
  }
});

BookingSchema.statics.validateEvents = function(events) {
  // Function accepts an array of events to validate as acceptable Event schema objects

  return new Promise((resolve, reject) => {
    // Check there is a non-zero number of events
    if (!events.length > 0) {
      let error = new ApplicationError.BookingInvalid();
      error.message = 'Booking must have at least one event';
      reject(error);
    }
    
    // Check each event in array complies with Mongoose Event schema
    
    validatedEvents = events.map(event => {
      try {
        return new Event(event);
      } catch(e) {
        const error = new ApplicationError.BookingInvalid();
        error.message = e.message;
        reject(error);
      }
    })
    resolve(validatedEvents);
  });
};

BookingSchema.statics.checkEventAvailabilities = function(events) {
  events.forEach(event => {
    console.log('check start');
    event.checkAvailabilityAgainstEventArray(events);
  });
  // let clashArray = [];
  // if (events.length > 1) {
  //   events.forEach(event => {
  //     event = events.shift();
  //     console.log('EVENT: ', event);
  //     console.log('EVENTS: ', events);
  //     if (events.length > 0) {
  //       let clashes = event.checkAvailabilityAgainstEventArray(events);
  //       if (clashes) {
  //         clashArray.push(clashes);
  //       }
  //     }
  //     // console.log('checking event');
  //     // const startDateTime = event.startDateTime;
  //     // const endDateTime = event.endDateTime;
  //   });
  // }
  // console.log(clashArray);
  // return clashArray;
}

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;