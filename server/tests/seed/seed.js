const {ObjectID} = require('mongodb');
const {User} = require('./../../models/user')


const users = [
  {
    _id: new ObjectID(),
    firstName: 'Chris',
    lastName: 'Chrisson',
    email: 'chris@chris.com',
    status: 'pending',
    password: 'password'
  },
  {
    _id: new ObjectID(),
    firstName: 'Dave',
    lastName: 'Daveson',
    email: 'dave@daveson.com',
    status: 'approved',
    password: 'password'
  },
];

const populateUsers = (done) => {
  User.deleteMany({})
  .then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo]);
  })
  .then(users => {
    // console.log('users', users);
    return users[0].generateAuthToken()
      .then(token => {
        return token;
      })
      .catch(e => {
        console.log(e)
      })
  })
    .then(() => done())
    .catch(e => {
      console.log(e)
    });
}

module.exports = {
  populateUsers,
  users
}