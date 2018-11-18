require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const {mongoose} = require('./db/mongoose');
const {errorMessage} = require('./utils/utils');
const applicationError = require('./errors/applicationErrors');
const utils = require('./utils/utils');

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

const {User} = require('./models/user');

// NODEMAILER CONFIG

const account = {
  user: 'qb45rpddnpyiub3l@ethereal.email',
  pass: 'uQeGPhpt8HVAfmu83D'
};

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: account.user,
    pass: account.pass
  }
})

  // SETUP EMAIL DATA
  let mailOptions = {
    from: '"Fred Foo" <foo@example.com>',
    to: 'bar@example.com',
    subject: 'Hello from Nodemailer!',
    text: 'Whoa, this freaking works!',
    html: '<b>This is awesome</b>'
  };

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
  console.log(user);
  const newUser = new User({
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    status: 'approved'
  });

  newUser.save()
    .then(doc => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      })
      res.status(200).send(doc);
    })
    .catch(e => {
      console.log(e);
      res.status(400).send(e);
    });
});

// DELETE USER
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  const validID = mongoose.Types.ObjectId.isValid(id);
  
  if (!validID) {
    let error = new applicationError.InvalidUserID();
    return res.status(error.status).send(error);
  }

  User.findOneAndDelete({_id: id})
    .then((user, err) => {
      if (err) {
        throw new applicationError.GeneralError();
      }
      if (!user) {
        throw new applicationError.UserNotFoundError();
      }
      return res.status(200).send(user);
    })
    .catch(e => {
      console.log('Fallen into catch')
      // error = new applicationError.GeneralError();
      return res.status(e.status).send(e);
    })
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
      if (user.status !== 'approved') {
        throw new applicationError.UserForbidden();
      }
      return user.checkPassword(credentials.password)
      .then(() => user)
      .catch(e => { throw e });
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