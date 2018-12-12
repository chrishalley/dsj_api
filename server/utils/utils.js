const applicationError = require('../errors/applicationErrors');

const isEmptyObject = function(obj) {
  for (key in obj) {
    return false;
  }
  return true;
};

const validateEmail = function(string) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(string);
}

module.exports = {
  isEmptyObject,
  validateEmail
};
