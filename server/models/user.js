const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {
  User
};