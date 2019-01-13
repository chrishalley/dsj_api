const expect = require('expect');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const ApplicationError = require('../errors/applicationErrors');

const User = require('./../models/user');
const {populateUsers, users, getTokens} = require('./seed/seed');

let tokens;

beforeEach(populateUsers);
before(async () => {
  tokens = await getTokens();
});

describe('user.generateAuthTokens', () => {

  it('should generate a string token containing user._id and auth access', (done) => {
    const user = users[1];

    User.findById(user._id)
      .then(user => {
        return user.generateAuthTokens()
          .then(res => {
            return res;
          })
          .catch(e => {
            console.log(e);
          })
      })
      .then(user => {
        expect(typeof user).toBe('object');
        return jwt.verify(user.tokens[0].token, process.env.JWT_SECRET);
      })
      .then(decoded => {
        expect(decoded).toMatchObject({
          id: user._id.toHexString(),
          access: user.role
        });
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should add the token to the user.tokens array', (done) => {
    const user = users[1];

    User.findById(user._id)
      .then(user => {
        return expect(user.tokens).not.toContain({
          access: 'auth'
        });
      })
      .then(() => {
        return User.findById(user._id);
      })
      .then((user) => {
        return user.generateAuthTokens()
          .then(() => {
            return user;
          })
          .catch(e => {
            throw e;
          });
      })
      .then(user => {
        expect(user.tokens).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              access: user.role
            })
          ])
        );
        done();
      })
      .catch(e => {
        console.log(e);
        done(e);
      });
  });

});

describe('user.clearToken', () => {

  it('should clear auth token from user.tokens array', (done) => {
    const user = users[0];

    User.findById(user._id)
      .then(user => {
        return user;
      })
      .then(user => {
        const token = user.tokens[0].token;
        expect(user.tokens).toEqual(expect.arrayContaining([
          expect.objectContaining({
            token: token
          })
        ]));
        return user.clearToken(token)
          .then(user => {
            return user;
          })
          .catch(e => {
            throw e;
          })
      })
      .then((res) => {
        return User.findById(res._id)
          .then(user => {
            expect(user).not.toEqual(expect.arrayContaining([
              expect.objectContaining({
                token: res.token
              })
            ]));
            done();
          })
      })
      .catch(e => {
        console.log(e);
        done(e);
      })
  });
});

describe('User.findUserByToken', () => {
  it('should return a user', (done) => {
    User.findById(users[0]._id)
      .then((user) => {
         return {
           id: user._id,
           token: user.tokens[0].token
         }
      })
      .then(payload => {
        return User.findUserByToken(payload.token)
          .then(user => { 
          expect(user._id).toEqual(users[0]._id);
          done();
        })
      })
      .catch(e => {
        done(e);
      });
  })

  it('should return an error for an invalid token', (done) => {
    const error = new ApplicationError.TokenInvalid();

    const userOne = User.findById(users[0]._id)

    userOne.then((user) => {
      User.findUserByToken('abcdefg')
        .then(res => {
          done();
        })
        .catch(e => {
          throw e;
        })
    })
    .catch(e => {
      expect(e.status).toEqual(error.status);
      expect(e.name).toEqual(error.name);
      done();
    })
      // .then((user) => {
      //   console.log('USER: ', user);
      //   const token = user.tokens[0].token;
      //   console.log()
      // })
      // // .then(payload => {
      // //   return User.findUserByToken(payload.token)
      // //     .then(user => { 
      // //     expect(user._id).toEqual(users[0]._id);
      // //     done();
      // //   })
      // // })
      // .catch(e => {
      //   done(e);
      // });
  })
});

describe('user.genPassResetToken', () => {
  it('should return a string', () => {
    User.findById(users[0]._id)
      .then(user => {
        const token = user.genPassResetToken();
        expect(typeof token).toBe('string');
      })
      .catch(e => {
        console.log(e);
      })

  })
});