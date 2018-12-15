const Event = require('../../models/event');
const utils = require('../../utils/utils');
const mongoose = require('mongoose');
const ApplicationError = require('../../errors/applicationErrors');

exports.getEvents = (req, res, next) => {
    Event.find({})
      .then(events => {
        return res.status(200).send(events);
      })
      .catch(e => {
        return next(e);
      });
};

exports.getSingleEvent = (req, res, next) => {
  const id = req.params.id;
  Event.findById(id)
    .then(event => {
      if (!event) {
        const error = new ApplicationError.EventNotFound();
        return next(error);
      }
      return res.status(200).send(event);
    })
    .catch(e => {
      return next(e);
    });
};

exports.createEvent = (req, res, next) => {
  const event = new Event(req.body);
  // Check event dateTimes are valid (i.e. dateTimes are in the future and endDateTime > startDateTime)
  const validDates = event.validateDateTimes();
  if (!validDates.validDates) {
    res.status(400).send(validDates.error)
  } else {
    // Check event does not clash with any existing events
    Event.checkAvailability(event.startDateTime, event.endDateTime)
      .then(() => {
        event.save()
          .then(event => {
            res.status(201).send(event);
          })
          .catch(e => {
            throw e;
          });
      })
      .catch(e => {
        next(e);
      });
  }
};

exports.deleteEvent = (req, res, next) => {

  Event.findByIdAndDelete(req.params.id)
    .then(event => {
      if (!event) {
        throw new ApplicationError.EventNotFound();
      }
      res.status(200).send(event);
    })
    .catch(e => {
      next(e);
    })
}

exports.updateEvent = (req, res, next) => {
  const id = req.params.id;
  const updates = req.body;

  Event.findByIdAndUpdate(id, {$set: updates}, (err, event) => {
    if (err) {
      const error = new ApplicationError.GeneralError();
      return next(error);
    }
    res.status(200).send(event);
  })
}