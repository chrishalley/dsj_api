module.exports = (req, res, next) => {
  const access = req.userData.access;
  if (!access || access !== 'super-admin') {
    res.status(401).json({
      message: 'Auth failed'
    })
  } else {
    next();
  }
}