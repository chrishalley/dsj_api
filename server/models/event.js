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

EventSchema.methods.checkDbClashes = function () {
  const event = this;
  let dbClashes = [];
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
        dbClashes = dbClashes.concat(events);
      }
      resolve(dbClashes);
    })
    .catch(e => {
      reject(e);
    });
  })
}

EventSchema.statics.checkClashes = function(events) {
  // Receives array of Event schema objects and checks through each of them for clashes in both saved events in the db and
  // also clashes with other events in the array.
  // Function returns a promise resolving to multidimensional array of arrays of event clashes. The first element in each array is the focusEvent
  // which is being checked for clashes. In the event no clashes are found, an empty array is returned in the resolved promise.
  // No duplicate clashes should be present.

  return new Promise((resolve, reject) => {
    let clashArray = [];

    let recurse = (events) => {
      if (events.length === 0) {
        resolve(clashArray);
      }
      const focusEvent = events.shift();
      const dbClashes = focusEvent.checkDbClashes();
      const arrayClashes = focusEvent.checkClashesInArray(events);
  
      Promise.all([dbClashes, arrayClashes])
        .then(res => {
          let focusEventClashArray = res[0].concat(res[1]);
          if (focusEventClashArray.length > 0) {
            focusEventClashArray.unshift(focusEvent);
            clashArray.push(focusEventClashArray);
          }
          recurse(events);
        })
        .catch(e => {
          reject(e);
        });
    };
    recurse(events);
  });
}

EventSchema.methods.checkClashWithEvent = function(event) {

  if (this.startDateTime > event.startDateTime && this.startDateTime < event.endDateTime) {
    console.log('startDateTime clash');
    return event;
  } else if (this.endDateTime > event.startDateTime && this.endDateTime < event.endDateTime) {
    console.log('endDateTime clash');
    return event;
  } else if (this.startDateTime < event.startDateTime && this.endDateTime > event.endDateTime) {
    console.log('wrapping time clash');
    return event;
  } else if (this.startDateTime === event.startDateTime && this.endDateTime === event.endDateTime) {
    console.log('identical time clash');
    return event;
  } else return null

};

EventSchema.methods.checkClashesInArray = function(events) {
  return new Promise((resolve, reject) => {
    const clashArray = [];
    events.forEach(event => {
      if (this._id.toString() === event._id.toString()) { 
        return;
      } else {
        if (this.checkClashWithEvent(event)) {
          clashArray.push(event)
        }
        return;
      }
    })
    resolve(clashArray);
  });
  

  // let clashEvents = [];
  // events.forEach(event => {
  //   console.log('cAAEA event: ', event);
  //   console.log('cAAEA events: ', events);
  //   if (this.startDateTime > event.startDateTime && this.startDateTime < event.endDateTime) {
  //     console.log('startDateTime clash');
  //     clashEvents.push(event);
  //   } else if (this.endDateTime > event.startDateTime && this.endDateTime < event.endDateTime) {
  //     console.log('endDateTime clash');
  //     clashEvents.push(event);
  //   } else if (this.startDateTime < event.startDateTime && this.endDateTime > event.endDateTime) {
  //     console.log('wrapping time clash');
  //     clashEvents.push(event);
  //   } else if (this.startDateTime === event.startDateTime && this.endDateTime === event.endDateTime) {
  //     console.log('identical time clash');
  //     clashEvents.push(event);
  //   }
  //   // console.log('this.startDateTime :', this.startDateTime);
  //   // console.log('event.startDateTime :', event.startDateTime);
  //   // console.log('this.endDateTime :', this.endDateTime);
  //   // console.log('event.endDateTime :', event.endDateTime);
  // });
  // console.log('CLASH EVENTS: ', clashEvents);
  // if (clashEvents.length > 0) {
  //   return clashEvents;
  // }
  // return null;
};

EventSchema.statics.checkAvailability = function (event) {
  const Event = this;
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
      const clashEvents = [];
      events.map(cur => {
        if (cur._id.toString() !== event._id.toString()) {
          return clashEvents.push(cur);
        }
      });
      if (clashEvents.length > 0) {
        const error = new applicationError.EventDateTimeClash();
        error.events = clashEvents;
        throw error;
      }
      resolve(event);
    })
    .catch(e => {
      reject(e);
    });
  })
}

EventSchema.statics.saveEventArray = function(eventArray) {
  return new Promise((resolve, reject) => {
    const savePromises = eventArray.map(event => {
      return event.save();
    })
  
    Promise.all(savePromises)
      .then(res => {
        resolve(res);
      })
      .catch(e => {
        console.log('error: ', e);
        reject(e);
      });
  });
};

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;