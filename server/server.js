require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
require('./db/mongoose');

const app = express();
app.use(bodyParser.json());

const usersRoutes = require('./api/routes/users');
const authRoutes = require('./api/routes/auth');

app.use(morgan('dev'));
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);

const port = process.env.PORT;

// CORS Options Config
if (process.env.NODE_ENV !== 'production') {
  var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  } 
} else {
  var corsOptions = {
    origin: 'https://cibolo-app.herokuapp.com',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
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


// Register User
// app.post('/users/register', (req, res) => {
//   var user = new User({
//     email: req.body.email,
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     status: 'pending'
//   });
//   user.save()
//     .then(doc => {
//       res.status(200).send(doc);
//     })
//     .catch(e => {
//       console.log(e);
//       const message = errorMessage(e);
//       res.status(400).send(e);
//     })
// });

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
})

app.use((error, req, res, next) => {
  console.log('there has been a terrible error!');
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = {
  app
};