const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

const tryLogin = async (email, password, User, secret, secret2) => {
  const user = await User.findOne({ email });
  if (!user) {
    //user with provided email not found
    throw new Error('invalid login');
  }

  const valid = await bcrypt.compare(password, user.password);
  if(!valid) {
    //bad password
    throw new Error('invalid password')
  };

  const [token, refreshToken] = await createTokens(user, secret, secret2 + user.password);

  return {
    user,
    token,
    refreshToken
  };
};

module.exports = {
  createTokens,
  refreshTokens,
  tryLogin
}