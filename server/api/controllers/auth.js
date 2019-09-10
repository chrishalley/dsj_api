const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

const User = require('../../models/user');
const applicationError = require('../../errors/applicationErrors');

exports.auth_login = (req, res, next) => {
  const credentials = req.body;
  console.log({credentials})
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
      console.log({e})
      next(e);
      // res.status(e.status).send(e);
    });
};

exports.set_password = async (req, res, next) => {

  console.log('**** auth set_password!!!')

  const { password, token } = req.body;
  const { id } = req.params;

  try {
    const verified = await verify_password_reset_token({ id, token });
    if (!verified) throw new applicationError.TokenExpired();
    console.log({verified});
    user = await User.findById(id);
    console.log({user})
    const success = await user.setPassword(password);
    console.log({success});
  } catch(e) {
    console.error(e);
  }

  // const currentPassword = req.body.currentPassword;
  // const newPassword = req.body.newPassword;

  // User.findUserById(req.params.id)
  //   .then(user => {
  //     if (!user) {
  //       throw new applicationError.UserNotFoundError();
  //     }

  //     return user.checkPassword(currentPassword)
  //       .then((valid) => {
  //         if (valid) {
  //           return user;
  //         }
  //         throw new applicationError.PasswordIncorrectError();
  //       })
  //       .catch(e => {
  //         throw e;
  //       });
  //   })
  //   .then(user => {
  //     return user.setPassword(newPassword)
  //       .then((user) => {
  //         res.status(200).send(user);
  //       })
  //       .catch(e => {
  //         throw new applicationError.GeneralError();
  //       })
  //   })
  //   .catch(e => {
  //     return next(e);
  //   });
};

const verify_password_reset_token = async ({id, token}) => {

  const validID = mongoose.Types.ObjectId.isValid(id);

  if (!validID) throw new applicationError.InvalidUserID();

  const user = await User.findById(id)
  if (!user) throw new applicationError.UserNotFoundError();
  
  try {
    const decoded = jwt.verify(token, user.password + user.dateApplied);
    if (decoded._id.toString() !== user._id.toString()) {
      throw new applicationError.TokenExpired();
    }
    return decoded
  } catch (e) {
    throw e;
  }
};