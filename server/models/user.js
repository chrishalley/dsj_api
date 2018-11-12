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
        bcrypt.compare(password, user.password)
          .then(res => {
            if (res) {
              resolve(user);
            } else {
              throw new applicationError.PasswordIncorrectError();
            }
          })
          .catch(e => {
            reject(new applicationError.PasswordIncorrectError());
          });
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

UserSchema.methods.setStatus = function(status) {
  const user = this;
  if(user) {
    return new Promise((resolve, reject) => {
      user.updateOne({
        $set: {
          status: status
        }
      })
        .then((res) => {
          resolve();
        })
        .catch(e => {
          reject(e);
        })
    });
  }
  throw new applicationError.UserNotFoundError();
};

UserSchema.methods.setPassword = function(password) {
  const user = this;
  if (user) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(14, (err, salt) => {
        if (err) {
          reject(err);
        }
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            reject(err);
          }
          resolve(hash);
        });
      });
    })
    .then((hash) => {
      user.updateOne({
        $set: {
          password: hash
        }
      });
      return user;
    })
    .catch(e => {      
      reject(e);
    })
  } else {
    throw new applicationError.UserNotFoundError();
  }
};

UserSchema.methods.checkPassword = function(password) {
  const user = this;
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
};  

UserSchema.pre('save', function (next) {
  var user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return console.log(err);
      }
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) {
          return console.log(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {
  User
};