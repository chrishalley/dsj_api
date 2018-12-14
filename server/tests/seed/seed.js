const {ObjectID} = require('mongodb');
const User = require('./../../models/user');
const Event = require('./../../models/event');

let superAdminToken = null;
let adminToken = null;

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

const getTokens = () => {
  const superAdminToken = User.find({role: 'super-admin'})
        .then(users => {
          return users[0].tokens[0].token;
        })
        .catch(e => {
        });

  const adminToken = User.find({role: 'admin'})
  .then(users => {
    return users[0].tokens[0].token;
  })
  .catch(e => {
  });

  return Promise.all([superAdminToken, adminToken])
    .then(res => {
      return {
        superAdminToken: res[0],
        adminToken: res[1]
      }
    })
}

const events = [
  {
    _id: new ObjectID(),
    title: 'Event One',
    description: 'Start time +1hr / end time +2hr',
    startDateTime: new Date().getTime() + (3600 * 1000),
    endDateTime: new Date().getTime() + (2 * 3600 * 1000),
  },
  {
    title: 'Event Two',
    description: 'Start time +3hr / end time +4hr',
    startDateTime: new Date().getTime() + (3 * 3600 * 1000),
    endDateTime: new Date().getTime() + (4* 3600 * 1000),
  },
  {
    title: 'Event Three',
    description: 'Start time +5hr / end time +6hr',
    startDateTime: new Date().getTime() + (5 * 3600 * 1000),
    endDateTime: new Date().getTime() + (6 * 3600 * 1000),
  }
]

const populateEvents = (done) => {
  Event.deleteMany({})
    .then(() => {
      const eventOne = new Event(events[0]).save();
      const eventTwo = new Event(events[1]).save();
      const eventThree = new Event(events[2]).save();

      return Promise.all([eventOne, eventTwo, eventThree]);
    })
    .then(events => {
      done();
    })
    .catch(e => {
      console.log(e);
    });
}

module.exports = {
  populateUsers,
  users,
  getTokens,
  populateEvents,
  events
}