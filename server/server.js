require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const generatePassword = require('generate-password');

const {mongoose} = require('./db/mongoose');
const {errorMessage} = require('./utils/utils');
const applicationError = require('./errors/applicationErrors');
const utils = require('./utils/utils');
const emails = require('./mail/emails');
const {nodemailerConfig} = require('./config/nodemailer');

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

const {User} = require('./models/user');

let transporter = nodemailer.createTransport(nodemailerConfig.transporter);

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
  const user = req.body;
  
  // const password = generatePassword.generate({
    //   length: 10,
    //   numbers: true,
    //   strict: true
    // });
    
  const newUser = new User({
    email: user.email,
    password: 'password',
    firstName: user.firstName,
    lastName: user.lastName
  });

  newUser.save()
    .then(doc => {

      let mailOptions = new emails.newUserWelcome(doc);
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('ERROR OCCURRED', error);
          const e = new applicationError.GeneralError('sendMail() failed');
          throw e;
        } else {
          console.log('Message sent %s', info.messageId);
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
          res.status(200).send(doc);
        }
      })
    })
    .catch(e => {
      // console.log('FKIN error: ', e);
      res.status(e.status ? e.status : 500).send(e);
    });
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
      .then((user) => {
        user.updateOne({
          $set: update
        })
        .then(() => {
          res.status(200).send('User updated');
        })
        .catch(e => {
          throw e;
        })
      })
      .catch(e => {
        res.status(500).send(e);
      });
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
      return user;
    })
    .then(user => {
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

module.exports = {
  app
};