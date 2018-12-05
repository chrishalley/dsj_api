const applicationError = require('../errors/applicationErrors');
module.exports = (req, res, next) => {
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
};