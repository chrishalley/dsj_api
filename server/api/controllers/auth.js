const User = require('../../models/user');

exports.auth_login = (req, res, next) => {
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
      console.log('There has been an error!')
      console.log(e);
      next(e);
      // res.status(e.status).send(e);
    });
};