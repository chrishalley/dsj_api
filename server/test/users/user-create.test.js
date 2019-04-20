const expect = require('expect');
const request = require('supertest');

const User = require('../../models/user');
const { populateUsers} = require('../seed/seed');
const { app } = require('../../server');

describe('User CREATE', () => {
  
  let users;
  let superAdmin;
  let admin;

  beforeEach((done) => {
    populateUsers()
      .then(res => {
        users = res;
        superAdmin = users.find(user => user.role === 'super-admin');
        admin = users.find(user => user.role === 'admin');
        done();
      })
      .catch(e => {
        console.error('beforeEach() error');
        done(e);
      });
  });

  it('should allow a super-admin to add a user with default role of "admin"', function (done) { // HAPPY-PATH

    const user = {
      firstName: 'Kelly',
      lastName: 'Kellyson',
      email: 'kelly@kellyson.com'
    };

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject(user);
        expect(res.body.role).toBe('admin');
      })
      .end(done)

  });

  it('should not add a user with email address that already exists', (done) => {
    const user = {
      firstName: 'New',
      lastName: 'User',
      email: admin.email,
    };

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(500)
      .expect(res => {
        expect(res.body.code).toBe(11000)
      })
      .end(done);
  });

  it('should add a user with role of "super-admin" if specified', (done) => {
    const user = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'super@admin.com',
      role: 'super-admin'
    }

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)
      .expect(201)
      .expect(res => {
        expect(res.body).toMatchObject(user)
        expect(res.body.role).toBe('super-admin')
      })
      .end(done);
  });

  it('should create unique secure passwords for each new user', (done) => {
    let userOne = new User({
      firstName: 'User',
      lastName: 'One',
      email: 'user@one.com'
    });

    let userTwo = new User({
      firstName: 'User',
      lastName: 'Two',
      email: 'user@two.com'
    });

    userOne = request(app)
      .post('/users')
      .send(userOne)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)

    userTwo = request(app)
      .post('/users')
      .send(userTwo)
      .set('Authorization', `Bearer ${superAdmin.tokens[0].token}`)

    Promise.all([userOne, userTwo])
      .then(res => {
        const passwordOne = User.findById(res[0].body._id)
          .then(user => {
            return user.password
          })

        const passwordTwo = User.findById(res[1].body._id)
          .then(user => {
            return user.password
          })

        return Promise.all([passwordOne, passwordTwo])
          .then(res => {
            expect(res[0]).not.toEqual(res[1])
            done();
          })
          .catch(e => {
            throw e;
          })
      })
      .catch(e => {
        done(e);
      });

  });

  it('should not allow an admin to add a new user', (done) => {

    const user = {
      firstName: 'Kelly',
      lastName: 'Kellyson',
      email: 'kelly@kellyson.com'
    };

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', `Bearer ${admin.tokens[0].token}`)
      .expect(403)
      .end(done);
  });
})