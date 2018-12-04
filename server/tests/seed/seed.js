const {ObjectID} = require('mongodb');
const User = require('./../../models/user')


const users = [
  {
    _id: new ObjectID(),
    firstName: 'Jack',
    lastName: 'Jackson',
    email: 'jack@jackson.com',
    password: 'password'
  },
  {
    _id: new ObjectID(),
    firstName: 'Dave',
    lastName: 'Daveson',
    email: 'dave@daveson.com',
    password: 'password',
    role: 'admin'
  },
  {
    _id: new ObjectID(),
    firstName: 'Jeff',
    lastName: 'Jeffson',
    email: 'jeff@jeffson.com',
    password: 'password',
    role: 'super-admin'
  },

];

const populateUsers = (done) => {
  User.deleteMany({})
    .then(() => {
      var userOne = new User(users[0]).save();
      var userTwo = new User(users[1]).save();
      var userThree = new User(users[2]).save();

      return Promise.all([userOne, userTwo, userThree]);
    })
    .then(users => {
      users.forEach(user => {
        user.generateAuthToken();
      })
      done();
    })
    .catch(e => {
      console.log(e);
    });
}

module.exports = {
  populateUsers,
  users
}