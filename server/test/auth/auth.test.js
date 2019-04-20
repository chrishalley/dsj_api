const expect = require('expect');
const request = require('supertest');

const {app} = require('../../server');
const User = require('../../models/user');
const ApplicationError = require('../../errors/applicationErrors')
const { populateUsers, users } = require('../seed/seed')

describe('POST /auth/login', () => {

  beforeEach(done => {
    populateUsers()
      .then(() => done())
      .catch(e => done(e));
  });

  it('should allow a registered user to login', (done) => {
    const user = users[0];

    request(app)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password
      })
      .expect(200)
      .expect(res => {
        expect(res.body._id.toString()).toEqual(user._id.toString());
        expect(res.body.tokens.length).toBeGreaterThan(0);
      })
      .end(done)
  });

  it('should return an auth failed error for a non-existing user', (done) => {
    const error = new ApplicationError.AuthFailedError();

    request(app)
      .post('/auth/login')
      .send({
        email: 'jhfdkjdhskjf@kldlfhdslkf.com',
        password: 'asdfghjkl'
      })
      .expect(403)
      .expect(res => {
        expect(res.body.name).toEqual(error.name);
      })
      .end(done);
  });

  it('should return an auth failed error for a wrong password', (done) => {
    const user = users[1];
    const error = new ApplicationError.AuthFailedError();

    request(app)
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'asdfghjkl'
      })
      .expect(403)
      .expect(res => {
        expect(res.body.message).toBe(error.message)
      })
      .end(done);
  })

});

describe('User passwords', () => {

  beforeEach(done => {
    populateUsers()
      .then(() => done())
      .catch(e => done(e));
  });

  it('allow an admin to set their own password', function (done) {
    this.timeout(8000);

    const newPassword = 'newPassword';

    User.findOne({ role: 'admin' })
      .then(user => {
        request(app)
          .post(`/users/${user._id}/resetPassword`)
          .send({
            newPassword: newPassword
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end((err) => {
            if (err) return done(err);
            User.findById(user._id)
              .then(user => {
                const newerPassword = 'evenNewerPassword';
                request(app)
                  .post(`/users/${user._id}/set-password`)
                  .send({
                    currentPassword: newPassword,
                    newPassword: newerPassword
                  })
                  .set('Authorization', 'Bearer ' + user.tokens[0].token)
                  .expect(200)
                  .end(done)
              })
              .catch(e => done(e));
          });
      })
      .catch(e => {
        done(e);
      });
  });

  it('should allow a super-admin to set an admin\'s password', function (done) { // todo: This seems overly convoluted
    this.timeout(8000);

    const newPassword = 'newPassword';
    let admin, superAdmin;

    const adminProm = User.findOne({ role: 'admin' });
    const superAdminProm = User.findOne({ role: 'super-admin' });

    Promise.all([adminProm, superAdminProm])
      .then(users => {
        [admin, superAdmin] = users;
      })
      .then(() => {
        request(app)
          .post(`/users/${admin._id}/resetPassword`)
          .send({ newPassword })
          .set('Authorization', 'Bearer ' + superAdmin.tokens[0].token)
          .expect(200)
          .end(err => {
            if (err) return done(err);
            User.findById(superAdmin._id)
              .then(user => {
                const newerPassword = 'evenNewerPassword';
                request(app)
                  .post(`/users/${admin._id}/set-password`)
                  .send({
                    currentPassword: newPassword,
                    newPassword: newerPassword
                  })
                  .set('Authorization', 'Bearer ' + superAdmin.tokens[0].token)
                  .expect(200)
                  .end(done)
              })
              .catch(e => done(e));
          })
      })
      .catch(e => done(e));
  });

  it('should not allow an admin to set another admin\'s password', function (done) {
    this.timeout(8000);
    let adminOne, adminTwo;
    const newPassword = 'newPassword';
    
    const error = new ApplicationError.UserForbidden();

    // adminOne is resetting adminTwo's password
    User.find({ role: 'admin' }) 
      .then(users => {
        [adminOne, adminTwo] = users;
        request(app)
          .post(`/users/${adminTwo._id}/resetPassword`)
          .send({ newPassword })
          .set('Authorization', 'Bearer ' + adminOne.tokens[0].token)
          .expect(403)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.message).toEqual(error.message);
            done();
          })
      })
      .catch(e => done(e));
  });

  it('should return an error for an authenticated admin request with wrong current password', (done) => {

    const error = new ApplicationError.PasswordIncorrectError();

    User.findOne({ role: 'admin' })
      .then(user => {
        request(app)
          .post(`/users/${user._id}/set-password`)
          .send({
            currentPassword: 'pasword',
            newPassword: 'password123'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(error.message);
          })
          .end(done);
      })
      .catch(e => done(e));

  });
  
  it('should return an error for an authenticated super-admin request with wrong current password', (done) => {

    const error = new ApplicationError.PasswordIncorrectError();

    User.findOne({ role: 'super-admin' })
      .then(user => {
        request(app)
          .post(`/users/${user._id}/set-password`)
          .send({
            currentPassword: 'pasword',
            newPassword: 'password123'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(error.message);
          })
          .end(done);
      })
      .catch(e => done(e));

  });

  it('should return an error for an authenticated admin request with invalid id', (done) => {

    const error = new ApplicationError.InvalidObjectID();

    User.findOne({ role: 'admin' })
      .then(user => {
        request(app)
          .post(`/users/${user._id}j/set-password`)
          .send({
            currentPassword: 'password',
            newPassword: 'password123'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(error.status)
          .expect(res => {
            expect(res.body.message).toEqual(error.message);
          })
          .end(done);
      })
      .catch(e => done(e));

  });
  
  it('should return an error for an authenticated super-admin request with invalid id', (done) => {

    const error = new ApplicationError.InvalidObjectID();

    User.findOne({ role: 'super-admin' })
      .then(user => {
        request(app)
          .post(`/users/${user._id}j/set-password`)
          .send({
            currentPassword: 'password',
            newPassword: 'password123'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(error.message);
          })
          .end(done);
      })
      .catch(e => done(e));

  });
})

describe('Forgotten password', () => {

  beforeEach(done => {
    populateUsers()
      .then(() => done())
      .catch(e => done(e));
  });

  it('should return an error for an email not belonging to a user', (done) => {
    const error = new ApplicationError.UserNotFoundError();
    const email = 'nonexistant@email.com';

    request(app)
      .post('/users/reset-password')
      .send({ email })
      .expect(error.status)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  });

  it('should return an error for an invalid email', (done) => {
    const invalidEmail = 'invalidEmail';
    const error = new ApplicationError.InvalidRequest();

    request(app)
      .post('/users/reset-password')
      .send({ email: invalidEmail })
      .expect(error.status)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  });

  it('should result in 200 for email belonging to user in DB', (done) => {
    User.findOne({})
      .then(user => {
        request(app)
          .post('/users/reset-password')
          .send({ email: user.email })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchObject({
              email: user.email
            })
          })
          .end(done);
      })
  });

})