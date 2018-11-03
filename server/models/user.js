const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    minLength: 6,
    default: 'password'
  },
  dateApplied: {
    type: Number,
    required: true,
    default: new Date().getTime()
  },
  dateApproved: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    required: true
  }
});

UserSchema.statics.findByCredentials = function(email, password) {
  var User = this;
  return User.findOne({email})
    .then(user => {
      if (!user) {
        return Promise.reject();
      }
      return new Promise((resolve, reject) => {
        if (user.password === password) {
          resolve(user);
        } else {
          reject('Password does not match');
        }
      });
    })
    .catch(e => {
      console.log(e)
      return Promise.reject();
    });
};

var User = mongoose.model('User', UserSchema);

module.exports = {
  User
};