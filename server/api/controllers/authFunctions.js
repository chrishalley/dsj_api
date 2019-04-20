const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ApplicationError = require('../../errors/applicationErrors')

const createTokens = async (user, secret1, secret2) => {
  
  const createToken = jwt.sign({id: user._id, access: user.role}, secret1, {expiresIn: '24hr'});

  const createRefreshToken = jwt.sign({id: user._id}, secret2 + user.password, {expiresIn: '24hr'});

  return Promise.all([createToken, createRefreshToken]);
};

const refreshTokens = async (token, refreshToken, User, secret, secret2) => {
  let userId = -1;

  try {
    const { user: { id } } = jwt.decode(refreshToken);
    userId = id;
  } catch (err) {
    return {}
  };

  if (!userId) {
    return {}
  };

  const user = await User.findOne({ where: { id: userId }, raw: true});

  if (!user) {
    return {}
  };

  const refreshSecret = secret2 + user.password;

  try {
    jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    return {}
  }

  const [newToken, newRefreshToken] = await createTokens(user, secret, refreshSecret);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user
  };
};

const tryLogin = (email, password, User, secret, secret2) => {
  let user
  return new Promise((resolve, reject) => {
    User.findOne({ email })
      .then((result) => {
        if (!result) {
          //user with provided email not found
          throw new ApplicationError.AuthFailedError()
        }
        user = result
        return bcrypt.compare(password, user.password)
      })
      .then(valid => {
        if (!valid) {
          //bad password
          const error = new ApplicationError.AuthFailedError()
          throw error
        }
        return createTokens(user, secret, secret2 + user.password);
      })
      .then(tokens => {
        const [token, refreshToken] = tokens
        resolve({
          user,
          token,
          refreshToken
        });
      })
      .catch(e => {
        reject(e)
      })
  })
};

module.exports = {
  createTokens,
  refreshTokens,
  tryLogin
}