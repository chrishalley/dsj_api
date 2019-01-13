const jwt = require('jsonwebtoken');
const ApplicationError = require('../errors/applicationErrors');

module.exports = (req, res, next) => {
  const error = new ApplicationError.UserUnauthenticated();
  console.log(req.headers)
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    if (decoded) {
      req.userData = decoded;
      return next();
    }
    return next(error);
  } else {
    next(error);
  }
};