const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {User} = require('./../models/user');
const {populateUsers, users} = require('./seed/seed');
const applicationError = require('../errors/applicationErrors');

beforeEach(populateUsers);
//GET /users/:id
describe('GET /users/:id', () => {
  it('should return a user object', done => {
    var user = users[0];

    request(app)
      .get(`/users/${user._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toEqual(user.email);
      })
      .end(done);
  });

  it('should return 404 for non-existent id', (done) => {
    var user = users[0];
    let userID = user._id.toHexString().split('').reverse().join('');
    const error = new applicationError.UserNotFoundError();

    request(app)
      .get(`/users/${userID}`)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  });

  it('should return a 400 for an invalid id',done => {
    var user = users[0];
    let userID = user._id + 'a';

    const error = new applicationError.InvalidUserID();

    request(app)
      .get(`/users/${userID}`)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  });
});

// DELETE /users/:id
describe('DELETE /users/:id', () => {
  it('should delete a user by id', (done) => {
    const user =  users[0];
    
    request(app)
      .delete(`/users/${user._id}`)
      .expect(200)
      .expect((res) => {
        expect(res).toEqual(user);
      })
      .end(() => {
        request(app)
        .get('/users')
        .expect(200)
        .expect(users => {
          expect(users).not.toContain(user);
        })
        .end(done)
      });
  });

  it('should throw 404 for not-existent id', (done) => {
    const user =  users[0];
    let userID = user._id.toHexString().split('').reverse().join('');
    const error = new applicationError.UserNotFoundError();
    
    request(app)
      .delete(`/users/${userID}`)
      .expect(error.status)
      .expect((res) => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  });
  
  it('should throw 400 for invalid id', (done) => {
    const user =  users[0];
    let userID = user._id + 'a';
    const error = new applicationError.InvalidUserID();
    
    request(app)
      .delete(`/users/${userID}`)
      .expect(error.status)
      .expect((res) => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  });
});

describe('PUT /users/:id', () => {
  it('should set a user\'s status to approved', (done) => {

    var user = users[0];
    var url = '/users/' + user._id;

    request(app)
      .put(url)
      .send({
        status: 'approved'
      })
      .expect(200)
      .expect(res => {

        expect(typeof res.body).toBe('object');
      })
      .end(done);
  });

  it('should return 400 error on empty object', (done) => {
    var user = users[0];
    var url = `/users/${user._id}`;
    var error = new applicationError.InvalidRequest();
    
    request(app)
    .put(url)
    .send({})
    .expect(400)
    .expect(res => {
      
      expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  })
});

// GET /users
describe('GET /users', () => {
  it('should return a 200 and array of users', done => {
    request(app)
      .get('/users')
      .expect(200)
      // .expect(res => {
      //   const data = res.body;
      //   console.log(typeof data);
      //   expect(typeof data).toBe('array');
      //   })
      .end(done);
  });
});

describe('POST /users/login', () => {
  
  it('should return a 404 for a non-existing user', (done) => {
    const user = users[0];

    request(app)
      .post('/users/login')
      .send({
        email: 'jhfdkjdhskjf@kldlfhdslkf.com',
        password: user.password
      })
      .expect(404)
      .expect(res => {
        expect(res.body.name).toEqual('UserNotFoundError');
      })
      .end(done);
  });

  it('should return a 200 for an approved existing user', (done) => {
    const  user = users[1];

    request(app)
      .post('/users/login')
      .send({
        email: user.email,
        password: user.password
      })
      .expect(200)
      .expect(res => {
        console.log('RES.BODY', res.body);
        expect(res.body._id).toEqual(user._id.toHexString());
        expect(res.body.tokens.length).toBeGreaterThan(0);
      })
      .end(done);
  });

  it('should return 403 for a non-approved user', (done) => {
    const user = users[0];
    const error = new applicationError.UserForbidden();

    request(app)
      .post('/users/login')
      .send({
        email: user.email,
        password: user.password
      })
      .expect(403)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  })

  it('should return 400 for a wrong password', (done) => {
    const user = users[1];
    const error = new applicationError.PasswordIncorrectError();

    request(app)
      .post('/users/login')
      .send({
        email: user.email,
        password: 'passworten'
      })
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe(error.message)
      })
      .end(done);
  })
});

describe('POST /users/:id/set-password', () => {

  it('should return an error for a request with wrong current password', (done) => {
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
        expect(res.error.text).toEqual('Password incorrect');
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

  it('should return user object for a valid request', (done) => {
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
        expect(res.body.password).not.toBe(user.password);
      })
      .end(done);
  });
});