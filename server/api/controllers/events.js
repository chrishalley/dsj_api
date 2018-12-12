const Event = require('../../models/event');
const utils = require('../../utils/utils');

exports.getEvents = (req, res, next) => {
    res.status(200).send('res from controller');
};

exports.createEvent = (req, res, next) => {
  const event = new Event(req.body);
  // Check event dateTimes are valid (i.e. dateTimes are in the future and endDateTime > startDateTime)
  const validDates = event.validateDateTimes();
  if (!validDates.validDates) {
    res.status(400).send(validDates.error)
  } else {
    // Check event does not clash with any existing events
    event.checkAvailability()
      .then(() => {
        event.save()
          .then(event => {
            res.status(201).send(event);
          })
          .catch(e => {
            console.log('Error: ', e);
            throw e;
          });
      })
      .catch(e => {
        next(e);
      });
  }
};