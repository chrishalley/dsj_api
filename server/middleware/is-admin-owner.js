const applicationError = require('../errors/applicationErrors');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;

module.exports = (req, res, next) => {
  if (ObjectId.isValid(req.params.id)) {
    if (req.userData.access === 'super-admin') {
      next();
    } else {
      if (req.userData.id === req.params.id) {
        next();
      } else {
        const error = new applicationError.UserForbidden();
        res.status(error.status).send(error);
      }
    }
  } else {
    const error = new applicationError.InvalidObjectID();
    res.status(error.status).send(error);
  }
};