require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
require('./db/mongoose');
const applicationError = require('./errors/applicationErrors');

const app = express();
app.use(bodyParser.json());

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

const usersRoutes = require('./api/routes/users');
const authRoutes = require('./api/routes/auth');
const eventRoutes = require('./api/routes/events');

app.use(morgan('dev'));
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
})

app.use((error, req, res, next) => {
  let err = new applicationError.GeneralError();
  if (error instanceof applicationError.ApplicationError) {
    res.status(error.status).send(error);
  } else if (error.name === "MongoError") {
    err.message = error.errmsg;
    err.code = error.code;
    res.status(err.status).send(err);
  } else {
    const genericError = new applicationError.GeneralError();
    res.status(genericError.status).send(genericError);
  }
});

module.exports = {
  app
};