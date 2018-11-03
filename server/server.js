require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const {mongoose} = require('./db/mongoose');
const {errorMessage} = require('./utils/errors');

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