const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const applicationError = require('../errors/applicationErrors');

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
        throw new applicationError.UserNotFoundError();
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
      return Promise.reject(e);
    });
};

UserSchema.statics.findUserById = function(id) {
  var User = this;
  return User.findById(id)
    .then(user => {
      if (!user) {
        throw new applicationError.UserNotFoundError();
      } 
      return user;
    })
    .catch(e => {
      throw new applicationError.InvalidUserID();
    });
};

UserSchema.methods.setPassword = function(id, password) {
  const user = this;
  if (user) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(14, (err, salt) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          console.log(hash);
          resolve(hash);
        })
      })
    })
    .then((hash) => {
      console.log(user);
      return user.updateOne({
        $set: {
          password: hash
        }
      })
    })
    .catch(e => {
      console.log(e);
    })
  }
  return new Promise((res, rej) => {
    res('set password route');
  })
};

var User = mongoose.model('User', UserSchema);

module.exports = {
  User
};