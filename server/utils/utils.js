const isEmptyObject = function(obj) {
  for (key in obj) {
    return false;
  }
  return true;
};

module.exports = {
  isEmptyObject
};