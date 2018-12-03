const express = require('express');
const router = express.Router();

const User = require('../../models/user');

// USER LOGIN
router.post('/login', (req, res, next) => {
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
      console.log(e);
      res.status(e.status).send(e);
    });
});



module.exports = router;