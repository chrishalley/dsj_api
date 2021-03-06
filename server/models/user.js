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
    minLength: 6
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
  role: {
    type: String,
    required: true,
    default: 'admin'
  },
  tokens: {
    type: Array
  }
});

UserSchema.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj.password;
  return obj;
}

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
      throw e;
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
      return user;
    })
    .catch(e => {
      throw e;
    });
};

UserSchema.methods.generateAuthToken = function() {
  const user = this;
  const access = this.role;
  const payload = {
    id: user._id.toHexString(),
    access: access
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h'
  }).toString();
  user.tokens = user.tokens.filter(cur => {
    return cur.access !== access;
  });
  user.tokens = user.tokens.concat([{access, token}]);
  return User.updateOne({_id: user._id}, {tokens: user.tokens})
    .then(() => {
      return user;
    })
    .catch(e => {
      throw e;
    })
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
    throw new applicationError.GeneralError('clearToken() failed');
    // reject(new applicationError.GeneralError('clearToken() failed'));
  });
};

UserSchema.statics.findUserByToken = function(token) {
  const User = this;
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

UserSchema.methods.genPassResetToken = function() {
  user = this;
  const payload = {
    _id: user._id,
  };
  const secret = user.password + user.dateApplied;
  return jwt.sign(payload, secret).toString();
};

UserSchema.pre('save', function (next) {
  var user = this;
  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
        // return console.log(err);
      }
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) {
          return next(err);
        }
        user.password = hash;
        return next();
      });
    });
  } else {
    return next();
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;