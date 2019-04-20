const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `.${process.env.NODE_ENV}.env`) });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
require('./db/mongoose');
const applicationError = require('./errors/applicationErrors');

const app = express();
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))


// CORS Options Config
if (process.env.NODE_ENV !== 'production') {
  var corsOptions = {
    origin: '*',
    // origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  } 
} else {
  var corsOptions = {
    origin: 'https://cibolo-app.herokuapp.com',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
}

app.use(cors(corsOptions));

const usersRoutes = require('./api/routes/users');
const authRoutes = require('./api/routes/auth');
const eventRoutes = require('./api/routes/events');
const bookingRoutes = require('./api/routes/bookings');
const staticRoutes = require('./api/routes/statics');
const profileImages = require('./api/routes/profileImages');

app.use(morgan('dev'));
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/bookings', bookingRoutes);
app.use('/statics', staticRoutes);
app.use('/profileImages', profileImages);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.use((req, res, next) => {
  console.log('req', req);
  const error = new Error('Not found');
  error.status = 404;
  next(error);
})

app.use((error, req, res, next) => {
  console.log(error);
  let err = new applicationError.GeneralError();
  if (error instanceof applicationError.ApplicationError) {
    res.status(error.status).send(error);
  } else if (error.name === "MongoError") {
    err.message = error.errmsg;
    err.code = error.code;
    res.status(err.status).send(err);
  } else if (error.name === "ValidationError") {
    err = new applicationError.ValidationError();
    err.message = error.message;
    res.status(err.status).send(err);
  } else {
    res.status(err.status).send(err);
  }
});

module.exports = {
  app
};