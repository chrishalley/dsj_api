const expect = require('expect');
const request = require('supertest');

const User = require('../../models/user');
const { populateUsers } = require('../seed/seed');
const { app } = require('../../server');

const applicationError = require('../../errors/applicationErrors');

describe('Users UPDATE', () => {
  
  let users;
  let superAdmin;
  let admin;

  beforeEach(done => {
    populateUsers()
      .then(res => {
        users = res;
        superAdmin = users.find(user => user.role === 'super-admin');
        admin = users.find(user => user.role === 'admin');
        done();
      })
      .catch(e => {
        console.error('beforeEach() error', e);
        done(e);
      })
  });

  it('should return a 401 for unauthenticated users and not update the target user', (done) => {
    const error = new applicationError.UserUnauthenticated();
    const randomString = 'somethingRandom';
    request(app)
      .patch(`/users/${admin._id}`)
      .send({ role: randomString })
      .expect(401)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end((err, res) => {
        if (err) return done(err);
        User.findById(admin._id)
          .then(user => {
            expect(user._id.toString()).toEqual(admin._id.toString());
            expect(user.role).not.toEqual(randomString);
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should return 400 error on empty object and target user should not change', (done) => {
    const error = new applicationError.InvalidRequest();

    request(app)
      .patch(`/users/${admin._id}`)
      .send({})
      .set('Authorization',`Bearer ${superAdmin.tokens[0].token}`)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end((err, res) => {
        User.findById(admin._id)
          .then(user => {
            expect(user.firstName).toEqual(admin.firstName);
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should return 403 error for an admin editing another admin\'s details and edit should not be successful', (done) => {
    const [adminOne, adminTwo] = users.filter(user => user.role === 'admin');
    const edit = 'newEmail@email.com';
      request(app)
        .patch(`/users/${adminOne._id}`)
        .send({
          email: edit
        })
        .set('Authorization', 'Bearer ' + adminTwo.tokens[0].token)
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          User.findById(adminOne._id)
            .then(user => {
              expect(user.email).not.toEqual(edit);
              done();
            })
            .catch(e => done(e));
        });
  });

  it('should allow a super-admin to edit an admin\'s info', (done) => {
    const emailChange = 'newAdmin@test.com';
      request(app)
        .patch(`/users/${admin._id}`)
        .send({ email: emailChange })
        .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
        .expect(200)
        .end(err => {
          if (err) return done(err);
          User.findById(admin._id)
            .then(user => {
              expect(user.email).toEqual(emailChange);
              done();
            })
            .catch(e => done(e));
        });
  });

  it('should allow a super-admin to edit their own info', (done) => {
    const emailChange = 'newSuperAdmin@test.com';
      request(app)
        .patch(`/users/${superAdmin._id}`)
        .send({ email: emailChange })
        .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
        .expect(200)
        .end(err => {
          if (err) return done(err);
          User.findById(superAdmin._id)
            .then(user => {
              expect(user.email).toEqual(emailChange);
              done();
            })
            .catch(e => done(e));
        });
  });

  it('should allow an admin to edit their own info', (done) => {
    const newEmail = 'newEmail@email.com';
      request(app)
        .patch(`/users/${admin._id}`)
        .send({
          email: newEmail
        })
        .set('Authorization', `Bearer ${admin.tokens[0].token}`)
        .expect(200)
        .expect(res => {
          expect(res.body.email).toEqual(newEmail);
        })
        .end(err => {
          if (err) return done(err);
          User.findById(admin._id)
            .then(user => {
              expect(user.email).toEqual(newEmail);
              done();
            })
            .catch(e => done(e));
        });
  });
})