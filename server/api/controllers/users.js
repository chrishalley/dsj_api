const mongoose = require('mongoose');
const generatePassword = require('generate-password');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const emails = require('../../mail/emails');
const applicationError = require('../../errors/applicationErrors');
const utils = require('../../utils/utils');

exports.users_get_users_list = (req, res, next) => {
  User.find({})
    .then(users => {
      if (users.length > 0) {
        return res.status(200).send(users);
      } else {
        throw new applicationError.UserNotFoundError();
      }
    })
    .catch(e => {
      return next(e);
    });
}

exports.users_save_new_user = (req, res, next) => {
  let user = req.body;
  
  const password = generatePassword.generate({
      length: 16,
      numbers: true,
      strict: true
    });

  let newUser = new User(user);
  newUser.password = password;
  
  if (process.env.NODE_ENV !== 'test') {
    const userProm = newUser.save();
    const mailProm = userProm.then(user => {
      const token = user.genPassResetToken();
      const setPassURL = `${process.env.FRONTEND_BASE_URL}/dashboard/users/${user._id}/set-password?token=${token}`
      
      const options = {
        setPassURL,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      };
      const message = new emails.newUserWelcome(options);
      
      return emails.sendMail(message)
    })
    return Promise.all([userProm, mailProm])
      .then(([user, mail]) => {
        res.status(201).send(user);
      })
      .catch(e => {
        return next(e);
      })
    } else {
      newUser.save()
      .then((user) => {
        res.status(201).send(user)
      })
      .catch(e => {
        return next(e); 
      })
    }
};

exports.users_get_single_user = (req, res, next) => {
  const validID = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!validID) {
    const error = new applicationError.InvalidObjectID();
    return next(error);
  }

  User.findById(req.params.id)
    .then(user => {
      if (user === null) {
        throw new applicationError.UserNotFoundError();
      }
      res.status(200).send(user);
    })
    .catch(e => {
      return next(e);
    })
};

exports.users_delete_user = (req, res, next) => {
  const id = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new applicationError.InvalidObjectID();
    return next(error);
  }

  // Check role of user
  User.findOne({_id: id})
    .then(user => {
      if (!user) {
        throw new applicationError.UserNotFoundError();
      }
      if (user.role === 'super-admin') {
        return User.find({role: 'super-admin'})
          .then(users => {
            if (users.length < 2) {
              throw new applicationError.GeneralError('Cannot delete only remaining super-admin', 409);
            } else {
              return user
            }
          })
          .catch(e => {
            throw e
          })   
      } else {
        return user
      }
    })
    .then(user => {
      user.delete()
        .then(user => {
          res.status(200).send(user);
        })
        .catch(e => {
          throw e;
        })
    }) 
    .catch(e => {
      return next(e);
    });
};

exports.users_edit_user = (req, res, next) => {
  const id = req.params.id;
  const update = req.body;
  if (!update || utils.isEmptyObject(update)) {
    const error = new applicationError.InvalidRequest();
    return next(error);
  } else {
  User.findUserById(id)
    .then(user => {
      return user.updateOne({
        $set: update
      })
    })
    .then(() => {
      return User.findById(id)
    })
    .then(user => {
      res.status(200).send(user);
    })
    .catch(e => {
      return next(e);
    });
  }
};

exports.users_set_password = (req, res, next) => {

  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  User.findUserById(req.params.id)
    .then(user => {
      if (!user) {
        throw new applicationError.UserNotFoundError();
      }

      return user.checkPassword(currentPassword)
        .then((valid) => {
          if (valid) {
            return user;
          }
          throw new applicationError.PasswordIncorrectError();
        })
        .catch(e => {
          throw e;
        });
    })
    .then(user => {
      return user.setPassword(newPassword)
        .then((user) => {
          res.status(200).send(user);
        })
        .catch(e => {
          throw new applicationError.GeneralError();
        })
    })
    .catch(e => {
      return next(e);
    });
};

exports.users_reset_password = (req, res, next) => {
  const email = req.body.email;
  
  // Validate email string
  const validEmail = utils.validateEmail(email);
  
  if(!validEmail) {
    const error = new applicationError.InvalidRequest();
    return next(error);
  }

  if (process.env.NODE_ENV !== 'test') {
    const UserProm = User.findByEmail(email)
    const mailProm = UserProm.then(user => {

      // Generate jwt 
      const token = user.genPassResetToken();
      const resetURL = `${process.env.FRONTEND_BASE_URL}/dashboard/users/${user._id}/password-reset?token=${token}`
      
        const options = {
          resetURL,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        };
        const message = new emails.forgotPasswordReset(options)
        return emails.sendMail(message)
    })

    return Promise.all([UserProm, mailProm])
      .then(([user, mail]) => {
        res.status(200).send(user)
      })
      .catch(e => {
        return next(e);
      })
    
  } else {
    User.findByEmail(email)
      .then(user => {
        res.status(200).send(user);
      })
      .catch(e => {
        return next(e);
      })
  }
};

exports.users_verify_reset_token = (req, res, next) => {
  const id = req.body._id;
  const token = req.body.token;

  const validID = mongoose.Types.ObjectId.isValid(id);
  
  if (!validID) {
    const error = new applicationError.InvalidObjectID();
    return next(error);
  }

  return User.findById(id)
    .then(user => {
      if (!user) {
        throw new applicationError.UserNotFoundError();
      }
      let decoded
      try {
        decoded = jwt.verify(token, user.password + user.dateApplied)
        if (decoded._id.toString() !== user._id.toString()) {
          throw new applicationError.TokenExpired();
        }
        return res.status(200).send()
      } catch(e) {
        throw e;
      }
    })
    .catch(error => {
      return next(error);
    }) 
};

exports.users_reset_password_by_id = (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id) !== true) {
    const error = new applicationError.InvalidObjectID();
    return next(error);
  } 

  const newPassword = req.body.newPassword;
  User.findById(id)
    .then(user => {
      if (!user) {
        throw new applicationError.UserNotFoundError();
      }
      return user.setPassword(newPassword)
    })
    .then(user => {
      res.status(200).send('Password successfully reset')
    })
    .catch(e => {
      return next(e);
    });
};