const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const {tryLogin} = require('./authFunctions.js')

exports.authLogin = (req, res, next) => {
  const {email, password} = req.body;

  tryLogin(email, password, User, process.env.JWT_SECRET, process.env.REFRESH_SECRET)
    .then(result => {
      const {token, refreshToken, user} = result;
      res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
      res.set('x-token', token);
      res.set('x-refresh-token', refreshToken);
      res.status(200).send(user);
    })
    .catch(e => {
      next(e);
    })
}

// exports.auth_login = (req, res, next) => {
//   const credentials = req.body;
//   User.findByEmail(credentials.email)
//     .then(user => {
//       return user.checkPassword(credentials.password)
//     })
//     .then(user => {
//       return user.generateAuthTokens();
//     })
//     .then(user => {
//       res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
//       createTokens(user, process.env.JWT_SECRET, process.env.REFRESH_SECRET)
//         .then(tokens => {
//           console.log('tokens: ', tokens)
//         })
      
//     })
//     .then(() => {
      
//       res.status(200).send(user);
//     })
//     .catch(e => {
//       next(e);
//       // res.status(e.status).send(e);
//     });
// };
