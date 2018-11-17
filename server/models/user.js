const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  },
  tokens: {
    type: Array
  }
});

UserSchema.statics.findByEmail = function(email) {
  var User = this;
  return User.findOne({email})
    .then(user => {
      if (!user) {
        throw new applicationError.UserNotFoundError();
      }
      return user;
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
    return user.updateOne({
      $set: {
        status: status
      }
    })
    .then(res => {
      return true;
    })
    .catch(e => {
      throw e;
    });
    // return new Promise((resolve, reject) => {
    //   user.updateOne({
    //     $set: {
    //       status: status
    //     }
    //   })
    //     .then((res) => {
    //       resolve();
    //     })
    //     .catch(e => {
    //       reject(e);
    //     })
    // });
  }
  throw new applicationError.UserNotFoundError();
};

UserSchema.methods.setPassword = function(password) {
  const user = this;
  if (user) {
    return bcrypt.hash(password, 14)
      .then(hash => {
        return user.updateOne({
          $set: {
            password: hash
          }
        })
      })
      .then(user => user)
      .catch(e => {
        throw e;
      });
  } else {
      throw new applicationError.UserNotFoundError();
  }
};

UserSchema.methods.checkPassword = function(password) {
  const user = this;
  return bcrypt.compare(password, user.password)
    .then(res => {
      if (!res) {
        throw new applicationError.PasswordIncorrectError();
      }
      return true;
    })
    .catch(e => {
      throw e;
    });
};

UserSchema.methods.generateAuthToken = function() {
  const user = this;
  const access = 'auth';
  const payload = {
    id: user._id.toHexString(),
    access: access,
    expiresAt: new Date().getTime() + (3600)
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET).toString();
  user.tokens = user.tokens.filter(cur => {
    return cur.access !== access;
  });
  user.tokens = user.tokens.concat([{access, token}]);
  return user.save()
    .then(res => {
      return user;
    })
    .catch(e => {
      reject(new applicationError.GeneralError('user.generateAuthToken() failed'));
    });
};

UserSchema.methods.clearToken = function(token) {
  const user = this;
  return User.findOneAndUpdate({
    _id: user.id,
    tokens: {
      $elemMatch: {
        token: token
      }
    }
  },
  { 
    $pull: { tokens: { token: token } } 
  })
  .then(() => {
    return user
  })
  .catch(() => {
    reject(new applicationError.GeneralError('clearToken() failed'));
  });
};

UserSchema.statics.findUserByToken = function(token) {
  const user = this;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch(e) {
    return Promise.reject();
  }
  if (decoded.id) {
    return User.findById(decoded.id)
      .then(user => {
        return user;
      })
      .catch(e => {
        throw new applicationError.UserNotFoundError();
      });
  }
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