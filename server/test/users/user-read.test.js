const expect = require('expect');
const request = require('supertest');

const User = require('../../models/user');
const { populateUsers } = require('../seed/seed');
const { app } = require('../../server');
const applicationError = require('../../errors/applicationErrors');


describe('Users READ', () => {
  
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

  it('should return a 401 for unauthenticated users', (done) => {
    request(app)
      .get(`/users/${admin._id}`)
      .expect(401)
      .end(done);
  });

  it('should return a user object for a request with admin priviledges', done => {
    const admins = users.filter(user => user.role === 'admin');
    const [adminOne, adminTwo] = admins;

    request(app)
      .get(`/users/${adminOne._id}`)
      .set('Authorization', 'Bearer ' + adminTwo.tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toEqual(adminOne.email);
      })
      .end(done);
  });

  it('should return a user object for a request with super-admin priviledges', done => {

    request(app)
      .get(`/users/${admin._id}`)
      .set('Authorization', 'Bearer ' + superAdmin.tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toEqual(admin.email);
      })
      .end(done);
  });

  it('should return 404 for non-existent id', (done) => {
    
    const wrongID = admin._id.toHexString().split('').reverse().join('');
    const error = new applicationError.UserNotFoundError();

    request(app)
      .get(`/users/${wrongID}`)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  });

  it('should return a 400 for an invalid id', done => {
    const wrongID = admin._id + 'a';

    const error = new applicationError.InvalidObjectID();

    request(app)
      .get(`/users/${wrongID}`)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  });

  it('should return a 200 and array of all users for an authenticated request', done => {
    let totalUsers = 0;
    request(app)
      .get('/users')
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.length).toBeGreaterThan(0);
        totalUsers = res.body.length;
      })
      .end(err => {
        if (err) return done(e);
        User.find({})
          .then(users => {
            expect(users.length).toEqual(totalUsers);
            done();
          })
          .catch(e => done(e));
      });
  });
});