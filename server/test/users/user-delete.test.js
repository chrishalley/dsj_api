const expect = require('expect');
const request = require('supertest');

const User = require('../../models/user');
const { populateUsers } = require('../seed/seed');
const { app } = require('../../server');
const applicationError = require('../../errors/applicationErrors');

describe('Users DELETE', () => {

  let users;
  let superAdmin;
  let admin;

  beforeEach((done) => {
    populateUsers()
      .then(res => {
        users = res;
        superAdmin = users.find(user => user.role === 'super-admin');
        admin = users.find(user => user.role === 'admin');
        done()
      })
      .catch(e => {
        console.error('Error in beforeEach()')
        done(e)
      });
  });

  it('should return a 401 for an unauthenticated user', (done) => {
    const user = users[0];
    const error = new applicationError.UserUnauthenticated();
      request(app)
        .delete(`/users/${user._id}`)
        .expect(error.status)
        .end((err, res )=> {
          if (err) return done(err);
          expect(res.body.message).toEqual(error.message);
          done();
        });
  });

  it('should not allow an admin user to delete another admin user', (done) => {
    const error = new applicationError.UserForbidden();
    const adminUsers = users.filter(user => user.role === 'admin');
    const [adminOne, adminTwo] = adminUsers;

      request(app)
        .delete(`/users/${adminOne._id}`)
        .set('Authorization', 'Bearer ' + adminTwo.tokens[0].token)
        .expect(error.status)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.message).toEqual(error.message);
          done();
        });

  });

  it('should allow an admin user to delete themselves', (done) => {
    request(app)
      .delete(`/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        console.log(res.body);
        done();
      })
  })

  it('should allow a super-admin to delete a user by id', (done) => {

      request(app)
        .delete(`/users/${admin._id}`)
        .set('Authorization', 'Bearer ' + superAdmin.tokens[0].token)
        .expect(200)
        .expect(res => {
          expect(res.body._id.toString()).toEqual(admin._id.toString()); 
        })
        .end((err) => {
          if (err) return done(err);
          User.find({_id: admin._id})
            .then(users => {
              expect(users.length).toBe(0);
              done();
            })
            .catch(e => {
              done(e);
            });
        });

  });

  it('should throw 404 for not-existent id', (done) => {
    const user = users[0];
    let userID = user._id.toHexString().split('').reverse().join('');
    const error = new applicationError.UserNotFoundError();

    request(app)
      .delete(`/users/${userID}`)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(error.status)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  });

  it('should throw 400 for invalid id', (done) => {
    const user = users[0];
    let userID = user._id + 'a';
    const error = new applicationError.InvalidObjectID();

    request(app)
      .delete(`/users/${userID}`)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(error.status)
      .expect((res) => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  });

  it('should not delete the only remaining super-admin', (done) => {

    request(app)
      .delete(`/users/${superAdmin._id}`)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(409)
      .end((err) => {
        if (err) return done(err);
        User.find({
            role: 'super-admin'
          })
          .then(users => {
            expect(users.length).toBe(1)
            done();
          })
          .catch(e => {
            done(e);
          })
      });
  });

  it('should delete a super-admin if there is more than one', (done => {

    const superOne = superAdmin;

    const superTwo = new User({
      firstName: 'Jim',
      lastName: 'Jimbo',
      email: 'jim@jimbo.com',
      role: 'super-admin',
      password: 'password'
    })

    superTwo.save()
      .then(superTwo => {
        request(app)
          .delete(`/users/${superTwo._id}`)
          .set('Authorization', `Bearer ${superOne.tokens[0].token}`)
          .expect(200)
          .end((err) => {
            if (err) return done(err);
            User.find({ role: 'super-admin' })
              .then(users => {
                expect(users.length).toBe(1);
                expect(users[0]._id.toString()).toBe(superOne._id.toString());
                done();
              })
              .catch(e => {
                done(e);
              });
          })
      })
      .catch(e => {
        done(e);
      });
  }));

});