require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const {mongoose} = require('./db/mongoose');
const {errorMessage} = require('./utils/errors');
const applicationError = require('./errors/applicationErrors');

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
  User.findById(req.params.id)
    .then(user => {
      if (user === null) {
        throw Error('error');
      }
      res.status(200).send(user);
    })
    .catch(e => {
      console.log(e);
      res.status(404).send('User not found');
    })
});

// SAVE NEW USER

app.post('/users', (req, res) => {
  var user = new User({
    email: req.body.email,
    password: req.body.password
  });

  user.save()
    .then(doc => {
      res.status(200).send(doc);
    })
    .catch(e => {
      const message = errorMessage(e);
      res.status(400).send({
        Error: message
      });
    });
});

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
  var user = req.body;
  User.findByCredentials(user.email, user.password)
    .then(doc => {
      res.status(200).send(doc);
    })
    .catch(e => {
      res.status(e.status).send(e);
    });
});

// USER SET PASSWORD
app.post('/users/:id/set-password', (req, res) => {

  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  User.findUserById(req.params.id)
    .then(user => {
      if (user === null) {
        error = new applicationError.UserNotFoundError();
        reject(error);
      } 
      return user;
    })
    .then(user => {
      console.log(currentPassword);
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
            console.log('Error: ', e);
          })
    })
    .catch(e => {
      res.status(e.status || 500).send(e.message);
    });
})

module.exports = {
  app
};