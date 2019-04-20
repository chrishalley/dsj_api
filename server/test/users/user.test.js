const expect = require('expect');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const ApplicationError = require('../../errors/applicationErrors');

const User = require('../../models/user');
const { populateUsers, users } = require('../seed/seed');

describe('user.generateAuthTokens', () => {

  beforeEach(done => {
    User.deleteMany({})
      .then(() => {
        done();
      })
  })

  it('should generate a string token containing user._id and auth access and add it to the user\'s tokens array', (done) => {
    const user = new User(users[1]);

    user.save()
      .then(user => {
        expect(user.tokens.length).toEqual(0);
        return user;
      })
      .then(user => user.generateAuthTokens())
      .then(user => {
        let decoded = jwt.verify(user.tokens[0].token, process.env.JWT_SECRET);
        expect(decoded).toMatchObject({
          id: user._id.toHexString(),
          access: user.role,
        });
        done();
      })
      .catch(e => done(e));
  });

});

describe('user.clearToken', () => {

  let user;
  let thing = 'go fuck yourself';

  beforeEach(done => {
    User.deleteMany({})
      .then(() => new User(users[1]).save())
      .then(user => user.generateAuthTokens())
      .then(res => {
        user = res;
        done();
      })
      .catch(e => done(e));
  });

  it('should clear auth token from user.tokens array', (done) => {
    expect(user.tokens.length).toEqual(1);
    user.clearToken(user.tokens[0].token)
      .then(() => {
        return User.findById(user._id);
      })
      .then(user => {
        expect(user.tokens.length).toEqual(0);
        done();
      })
      .catch(e => done(e));
  });
});

describe('User.findUserByToken', () => {

  let user;

  beforeEach(done => {
    User.deleteMany({})
      .then(() => new User(users[1]).save())
      .then(user => user.generateAuthTokens())
      .then(res => {
        user = res;
        done();
      })
      .catch(e => {
        console.error('beforeEach() error', e);
        done(e);
      });
  })

  it('should return a user', (done) => {

    User.findUserByToken(user.tokens[0].token)
      .then(res => {
        expect(res._id).toEqual(user._id);
        done();
      })
      .catch(e => done(e));
  })

  it('should return an error for an invalid token', (done) => {
    const error = new ApplicationError.TokenInvalid();

    User.findUserByToken('abcdefg')
      .then(res => {
        console.log('res', res);
        done();
      })
      .catch(e => {
        expect(e.message).toEqual(error.message);
        done();
      })
  });
});

describe('user.genPassResetToken', () => {
  let user;

  beforeEach(done => {
    User.deleteMany({})
      .then(() => new User(users[1]).save())
      .then(res => {
        user = res;
        done();
      })
      .catch(e => done(e))
  })

  it('should return a string', () => {
    const token = user.genPassResetToken();
    expect(typeof token).toEqual('string');
  })
});