const errorMessage = (e) => {
  let message = 'An error has occurred';
  if (e.code) {
    switch(e.code) {
      case 11000:
        return 'Duplicate key found'
        break
    }
  }
  return message;
};

module.exports = {
  errorMessage
}