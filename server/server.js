require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const generatePassword = require('generate-password');
const jwt = require('jsonwebtoken');

const {mongoose} = require('./db/mongoose');
const {errorMessage} = require('./utils/utils');
const applicationError = require('./errors/applicationErrors');
const utils = require('./utils/utils');
const emails = require('./mail/emails');

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

const {User} = require('./models/user');

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.get('/events', (req, res) => {
  res.status(200).send({
    message: "A ok!"
  });
});

app.post('/events', (req, res) => {
  res.status(200).send(req.body);
});

// GET USER INFO

app.get('/users/:id', (req, res) => {
  const validID = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!validID) {
    const error = new applicationError.InvalidUserID();
    return res.status(error.status).send(error);
  }

  User.findById(req.params.id)
    .then(user => {
      if (user === null) {
        throw new applicationError.UserNotFoundError();
      }
      res.status(200).send(user);
    })
    .catch(e => {
      // console.log(e);
      res.status(e.status).send(e);
    })
});

// GET USERS LIST

app.get('/users', (req, res) => {
  User.find({})
    .then(users => {
      res.status(200).send(users);
    })
    .catch(e => {
      console.log(e);
    });
})

// SAVE NEW USER

app.post('/users', (req, res) => {
  let user = req.body;
  
  const password = generatePassword.generate({
      length: 16,
      numbers: true,
      strict: true
    });
    // Added a pointless comment
  const newUser = new User({
    ...user,
    password: password
  });

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
          email: 'chrishalley86@gmail.com'
        }
      };
      const message = new emails.newUserWelcome(options);

      return emails.sendMail(message)
    })
    return Promise.all([userProm, mailProm])
      .then(([user, mail]) => {
        res.status(200).send(user)
      })
      .catch(e => {
        console.log(e);
        res.status(e.status ? e.status : 500).send(e);
      })
    } else {
      newUser.save()
      .then((user) => {
        res.status(200).send(user)
      })
      .catch(e => {
        res.status(e.status ? e.status : 500).send(e);  
      })
    }
});

// DELETE USER
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new applicationError.InvalidUserID();
    return res.status(error.status).send(error);
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
              throw new applicationError.GeneralError('Cannot delete only remaining super-admin', 403);
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
      return res.status(e.status).send(e);
    });
});

// Register User
app.post('/users/register', (req, res) => {
  var user = new User({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    status: 'pending'
  });
  user.save()
    .then(doc => {
      res.status(200).send(doc);
    })
    .catch(e => {
      console.log(e);
      const message = errorMessage(e);
      res.status(400).send(e);
    })
});


// USER LOGIN
app.post('/users/login', (req, res) => {
  const credentials = req.body;
  User.findByEmail(credentials.email)
    .then(user => {
      return user.checkPassword(credentials.password)
    })
    .then(user => {
      return user.generateAuthToken();
    })
    .then(user => {
      res.status(200).send(user);
    })
    .catch(e => {
      res.status(e.status).send(e);
    });
});

// UPDATING USERS
app.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const update = req.body;
  if (!update || utils.isEmptyObject(update)) {
    const error = new applicationError.InvalidRequest();
    return res.status(error.status).send(error);
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
      res.status(500).send(e);
    })
  }
});

// USER SET PASSWORD
app.post('/users/:id/set-password', (req, res) => {

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
      res.status(e.status || 500).send(e.message);
    });
});

// USER RESET-PASSWORD
app.post('/users/reset-password', (req, res) => {
  const email = req.body.email;

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
        console.log(e);
        res.status(e.status ? e.status : 500).send(e);
      })
    
  } else {
    User.findByEmail(email)
      .then(user => {
        res.status(200).send(user);
      })
      .catch(e => {
        res.status(e.status).send(e);
      })
  }
})

// Verify password-reset-link
app.post('/users/verify-password-reset-token', (req, res) => {
  const id = req.body._id;
  const token = req.body.token;

  const validID = mongoose.Types.ObjectId.isValid(id);
  
  if (!validID) {
    console.log('Invalid ID');
    const error = new applicationError.InvalidUserID();
    console.log(error)
    return res.status(error.status).json(error);
  }

  return User.findById(id)
    .then(user => {
      if (!user) {
        console.log('ERROR: No user found!')
        throw new applicationError.UserNotFoundError();
      }
      let decoded
      try {
        decoded = jwt.verify(token, user.password + user.dateApplied)
        if (decoded._id.toString() !== user._id.toString()) {
          throw new applicationError.TokenExpired();
        }
        return res.status(200).send('TRue')
      } catch(e) {
        res.status(403).send('Token Invalid')
      }
    })
    .catch(error => {
      console.log(error)
      return res.status(error.status).send(error);
    }) 
})

// Reset password by user id
app.post('/users/:id/resetPassword', (req, res) => {
  const id = req.params.id;
  const newPassword = req.body.newPassword
  User.findById(id)
    .then(user => {
      return user.setPassword(newPassword)
    })
    .then(user => {
      res.status(200).send('Password successfully reset')
    })
    .catch(e => {
      console.log(e)
      res.status(e.status).send(e.message)
    });
});

module.exports = {
  app
};