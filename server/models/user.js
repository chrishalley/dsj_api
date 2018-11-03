const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  dateApplied: {
    type: Number,
    required: true
  },
  dateApproved: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {
  User
};