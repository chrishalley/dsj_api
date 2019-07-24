const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useCreateIndex: true
})
.then(() => {
  console.log('Successfully connected to DB');
})
.catch(e => {
  console.log('Cannot connect to DB');
})

module.exports = {
  mongoose
};