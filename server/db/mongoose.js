const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useCreateIndex: true
})
.then(() => {
  console.log('success');
})
.catch(e => {
  console.log(e);
})

module.exports = {
  mongoose
};