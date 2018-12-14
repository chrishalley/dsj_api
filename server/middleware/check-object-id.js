const jwt = require('jsonwebtoken');
const ApplicationError = require('../errors/applicationErrors');
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  const validID = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validID) {
    const error = new ApplicationError.InvalidObjectID();
    return next(error);
  }
  next();
};