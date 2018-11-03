const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {User} = require('./../models/user');
const {populateUsers, users} = require('./seed/seed');

beforeEach(populateUsers);

describe('POST /users/login', () => {
  it('should return a 404 for a non-existing user', (done) => {
    var user = {
      email: 'nobody@nobody.com',
      password: 'password'
    }

    request(app)
      .post('/users/login')
      .send(user)
      .expect(404)
      .expect(res => {
      })
      .end(done)

  });

  it('should return a 200 for an existing user', (done) => {
    var user = users[0];

    request(app)
      .post('/users/login')
      .send(user)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toEqual(user._id.toHexString());
      })
      .end(done);
  });
});