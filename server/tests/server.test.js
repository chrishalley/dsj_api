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
        expect(res.body.name).toEqual('UserNotFoundError');
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

describe('POST /users/:id/set-password', () => {
  it('should return an error for a request with wrong password', (done) => {
    var user = users[0];
    var url = '/users/' + user._id + '/set-password';
    
    request(app)
      .post(url)
      .send({
        currentPassword: 'pasword',
        newPassword: 'password123'
      })
      .expect(400)
      .expect(res => {
        expect(typeof res).toBe('object');
      })
      .end(done);
  });

  it('should return an error for an invalid id', (done) => {
    var user = users[0];
    var url = '/users/' + user._id + 'j/set-password';

    request(app)
      .post(url)
      .send({
        currentPassword: 'password',
        newPassword: 'password123'
      })
      .expect(400)
      .expect(res => {
        expect(typeof res).toBe('object');
        expect(res.error.text).toEqual('Invalid user ID');
      })
      .end(done);
  });

  it('should return a string for a valid request', (done) => {
    var user = users[0];
    var url = '/users/' + user._id + '/set-password';

    request(app)
      .post(url)
      .send({
        currentPassword: 'password',
        newPassword: 'password123'
      })
      .expect(200)
      .expect(res => {
        expect(typeof res).toBe('object');
      })
      .end(done);
  });
});