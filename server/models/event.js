const mongoose = require('mongoose');

const applicationError = require('../errors/applicationErrors');

var EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  featuredImage: {
    type: String,
    required: true,
    default: '../static/stock.jpeg'
  },
  startDateTime: {
    type: String,
    required: true
  },
  endDateTime: {
    type: String,
    required: true
  },
  clientContact: {
    type: String,
    required: true,
    default: 'John Smith'
  }
});

EventSchema.methods.validateDateTimes = function () {

  const currentDateTime = new Date().getTime();
  let error = new applicationError.InvalidEventDates();

  if (this.startDateTime < currentDateTime) {
    error.message = 'Start date or time has already passed'
    return {
      validDates: false,
      error: error
    }
  } else if (this.endDateTime < currentDateTime) {
    error.message = 'End date or time has already passed'
    return {
      validDates: false,
      error: error
    }
  } else if (this.endDateTime < this.startDateTime) {
    error.message = 'End date or time is earlier than start date or time'
    return {
      validDates: false,
      error: error
    }
  } else {
    return {
      validDates: true
    }
  }
};

EventSchema.methods.checkAvailability = function () {
  const event = this;
  return new Promise((resolve, reject) => {
    Event.find({
      $or: [
        {
          startDateTime: {
            $gte: event.startDateTime,
            $lte: event.endDateTime
          }
        },
        {
          endDateTime: {
            $gte: event.startDateTime,
            $lte: event.endDateTime
          }
        },
        {
          $and: [
            {
              startDateTime: {
                $lte: event.startDateTime
              },
              endDateTime: {
                $gte: event.endDateTime
              }
            }
          ]
        }
      ]
    })
    .then(events => {
      if (events.length > 0) {
        const error = new applicationError.EventDateTimeClash();
        error.events = events;
        reject(error);
      }
      resolve(event);
    })
    .catch(e => {
      reject(e);
    });
  })
  
}

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;