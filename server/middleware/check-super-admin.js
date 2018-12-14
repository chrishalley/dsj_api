const ApplicationError = require('../errors/applicationErrors');

module.exports = (req, res, next) => {
  const access = req.userData.access;
  const error = new ApplicationError.UserForbidden();
  if (!access || access !== 'super-admin') {
    res.status(error.status).send(error);
  } else {
    next();
  }
}