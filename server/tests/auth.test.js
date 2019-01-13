const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const User = require('./../models/user')
const ApplicationError = require('./../errors/applicationErrors')
const {users} = require('./seed/seed')

describe.only('POST /auth/login', () => {
  it('should allow a registered user to login', (done) => {
    const user = users[0];

    request(app)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password
      })
      .expect(res => {
        console.log('***headers***', res.headers)
        console.log('***body***', res.body)
      })
      .expect(200)
      .end(done)
  })
})