const expect = require('expect');
const request = require('supertest');
const bcrypt = require('bcryptjs');

let {app} = require('./../server');
const User = require('./../models/user');
const {populateUsers, users} = require('./seed/seed');
const applicationError = require('../errors/applicationErrors');

let superAdminToken;
let adminToken;

before(populateUsers);
before(done => {
  User.find({role: 'super-admin'})
    .then(users => {
      // console.log(users[0].tokens[0].token);
      superAdminToken = users[0].tokens[0].token;
      done();
    })
    .catch(e => {
      console.log(e);
    });
});
before(done => {
  User.find({role: 'admin'})
    .then(users => {
      // console.log(users[0].tokens[0].token);
      adminToken = users[0].tokens[0].token;
      done();
    })
    .catch(e => {
      console.log(e);
    });
});


describe('POST /users', () => {

  it('should allow a super-admin to add a user with default role of "admin"', function(done) {
    this.timeout(8000);

    const user = {
      firstName: 'Kelly',
      lastName: 'Kellyson',
      email: 'kelly@kellyson.com'
    };

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', 'Bearer ' + superAdminToken)
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject(user);
        expect(res.body.role).toBe('admin');
      })
      .end(done)
    
  });

  it('should not add a user with email address that already exists', (done) => {
    const user = {
      firstName: users[0].firstName,
      lastName: users[0].lastName,
      email: users[0].email,
    };

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', 'Bearer ' + superAdminToken)
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
      .set('Authorization', 'Bearer ' + superAdminToken)
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
      .set('Authorization', 'Bearer ' + superAdminToken)
    
    userTwo = request(app)
      .post('/users')
      .send(userTwo)
      .set('Authorization', 'Bearer ' + superAdminToken)

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
        .set('Authorization', 'Bearer ' + adminToken)
        .expect(401)
        .end(done);
  });
});

//GET /users/:id
describe('GET /users/:id', () => {

  it('should return a 401 for unauthenticated users', (done) => {
    const user = users[0];

    request(app)
      .get(`/users/${user._id}`)
      .expect(401)
      .end(done);
  })

  it('should return a user object for an admin account', done => {
    var user = users[0];

    request(app)
      .get(`/users/${user._id}`)
      .set('Authorization', 'Bearer ' + adminToken)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toEqual(user.email);
      })
      .end(done);
  });
  
  it('should return a user object for a super-admin account', done => {
    var user = users[0];

    request(app)
      .get(`/users/${user._id}`)
      .set('Authorization', 'Bearer ' + superAdminToken)
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
      .set('Authorization', 'Bearer ' + adminToken)
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
      .set('Authorization', 'Bearer ' + adminToken)
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
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body._id.toString()).toEqual(user._id.toString());
      })
      .end(() => {
        request(app)
        .get('/users')
        .set('Authorization', 'Bearer ' + adminToken)
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

  it('should not delete the only remaining super-admin', (done) => {
    const user = users[2];

    request(app)
      .delete(`/users/${user._id}`)
      .expect(403)
      .end(() => {
        User.find({role: 'super-admin'})
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
    const superOne = users[2];
  
    const superTwo = new User({
      firstName: 'Jim',
      lastName: 'Jimbo',
      email: 'jim@jimbo.com',
      role: 'super-admin',
      password: 'password'
    })

    superTwo.save()
      .then(() => {
        request(app)
        .delete(`/users/${superOne._id}`)
        .expect(200)
        .end(() => {
          User.find({role: 'super-admin'})
            .then(users => {
              expect(users.length).toBe(1);
              done();
            })
            .catch(e => {
              done(e);
            });
        });
      })
      .catch(e => {
        done(e);
      });

  }))

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
      .set('Authorization', 'Bearer ' + adminToken)
      .expect(200)
      .expect(res => {
        expect(res.body.length).toBeGreaterThan(0);
      })
      .end(done);
  });
});

describe('POST /auth/login', () => {
  
  it('should return a 404 for a non-existing user', (done) => {
    const user = users[0];

    request(app)
      .post('/auth/login')
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

  it('should return a 200 for an existing user', (done) => {
    const user = users[1];

    request(app)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password
      })
      .expect(200)
      .expect(res => {
        expect(res.body._id).toEqual(user._id.toHexString());
        expect(res.body.tokens.length).toBeGreaterThan(0);
      })
      .end(done);
  });

  it('should return 400 for a wrong password', (done) => {
    const user = users[1];
    const error = new applicationError.PasswordIncorrectError();

    request(app)
      .post('/auth/login')
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

describe('POST /users/reset-password', () => {
  it('should receive an email', (done) => {
    const email = users[0].email;

    request(app)
      .post('/users/reset-password')
      .send({email: email})
      .expect((res) => {
        expect(res.body).toMatchObject({
          email: email
        })
      })
      .end(done);
  })
});

describe('POST /users/:id/resetPassword', () => {
  it('should change a users password', function(done) {
    this.timeout(8000);

    const user = users[0];
    oldPassword = user.password;
    newPassword = 'aNewPassword';

    request(app)
      .post(`/users/${user._id}/resetPassword`)
      .send({newPassword})
      .expect(200)
      .end(() => {
        User.findById(user._id)
          .then(user => {
            return new Promise((resolve, reject) => {
              bcrypt.compare(oldPassword, user.password, function(err, res) {
                if (err) {
                  reject(err);
                } else {
                  resolve(res);
                }
              });
            });
        })
        .then(res => {
          expect(res).toBe(false);
          done();
        })
        .catch(e => {
          done(e);
        })
      })
  })
})