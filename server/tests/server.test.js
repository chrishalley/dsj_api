const expect = require('expect');
const request = require('supertest');
const bcrypt = require('bcryptjs');

let {app} = require('./../server');
const User = require('./../models/user');
const {populateUsers, users, getTokens} = require('./seed/seed');
const applicationError = require('../errors/applicationErrors');
let tokens;


before(populateUsers);
before(async () => {
  tokens = await getTokens();
});
// before(done => {
//   User.find({role: 'super-admin'})
//     .then(users => {
//       console.log(users);
//       tokens.tokens.tokens.tokens.tokens.superAdminToken = users[0].tokens[0].token;
//       console.log(tokens.tokens.tokens.tokens.tokens.superAdminToken);
//       done();
//     })
//     .catch(e => {
//       console.log(e);
//     });
// });
// before(done => {
//   User.find({role: 'admin'})
//     .then(users => {
//       // console.log(users[0].tokens[0].token);
//       tokens.adminToken = users[0].tokens[0].token;
//       done();
//     })
//     .catch(e => {
//       console.log(e);
//     });
// });


describe('POST /users', () => {
  
  it('should allow a super-admin to add a user with default role of "admin"', function(done) {
    console.log('TOKENS: ', tokens);
    this.timeout(8000);

    const user = {
      firstName: 'Kelly',
      lastName: 'Kellyson',
      email: 'kelly@kellyson.com'
    };

    request(app)
      .post('/users')
      .send(user)
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
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
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
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
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
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
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
    
    userTwo = request(app)
      .post('/users')
      .send(userTwo)
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)

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
        .set('Authorization', 'Bearer ' + tokens.adminToken)
        .expect(403)
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
      .set('Authorization', 'Bearer ' + tokens.adminToken)
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
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
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
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  });

  it('should return a 400 for an invalid id',done => {
    var user = users[0];
    let userID = user._id + 'a';

    const error = new applicationError.InvalidObjectID();

    request(app)
      .get(`/users/${userID}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe(error.message);
      })
      .end(done);
  });
});

// DELETE /users/:id
describe('DELETE /users/:id', () => {

  it('should return a 401 for an unauthenticated user', (done) => {
    const user =  users[0];
    
    request(app)
      .delete(`/users/${user._id}`)
      .expect(401)
      .end(done);
  })
  
  it('should return a 403 for an admin user', (done) => {
    const user =  users[0];
    
    request(app)
      .delete(`/users/${user._id}`)
      .set('Authorization', 'Bearer ' + tokens.adminToken)
      .expect(403)
      .end(done);
  })

  it('should allow a super-admin to delete a user by id', (done) => {
    const user =  users[0];
    
    request(app)
      .delete(`/users/${user._id}`)
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
      .expect(200)
      .expect((res) => {
        expect(res.body._id.toString()).toEqual(user._id.toString());
      })
      .end(() => {
        request(app)
        .get('/users')
        .set('Authorization', 'Bearer ' + tokens.adminToken)
        .expect(200)
        .expect(users => {
          expect(users).not.toContain(user);
        })
        done();
      });
  });

  it('should throw 404 for not-existent id', (done) => {
    const user =  users[0];
    let userID = user._id.toHexString().split('').reverse().join('');
    const error = new applicationError.UserNotFoundError();
    
    request(app)
      .delete(`/users/${userID}`)
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
      .expect(error.status)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done)
  });
  
  it('should throw 400 for invalid id', (done) => {
    const user =  users[0];
    let userID = user._id + 'a';
    const error = new applicationError.InvalidObjectID();
    
    request(app)
      .delete(`/users/${userID}`)
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
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
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
      .expect(409)
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
        .set('Authorization', 'Bearer ' + tokens.superAdminToken)
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

describe('PATCH /users/:id', () => {
  
  it('should return a 401 for unauthenticated users', (done) => {
    const user = users[0];

    request(app)
      .patch(`/users/${user._id}`)
      .send({
        role: 'somethingRandom'
      })
      .expect(401)
      .end(done);
  });

  it('should return 400 error on empty object', (done) => {
    var user = users[2];
    var url = `/users/${user._id}`;
    var error = new applicationError.InvalidRequest();
    
    request(app)
      .patch(url)
      .send({})
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toEqual(error.message);
      })
      .end(done);
  })
  
  it('should return 403 error for an admin editing another admin\'s details', (done) => {
    let adminOne;
    let adminTwo;

    User.find({email: users[0].email})
        .then(users => {
          return adminOne = users[0];
        })
        .then(() => {
          return User.find({email: users[1].email})
            .then(users => {
              return adminTwo = users[0];
            })
        })
        .then(() => {
          // console.log('adminOne: ', adminOne);
          // console.log('adminTwo: ', adminTwo);
        })
        .then(() => {
          request(app)
            .patch(`/users/${adminOne._id}`)
            .send({email: 'newEmail@email.com'})
            .set('Authorization', 'Bearer ' + adminTwo.tokens[0].token)
            .expect(403)
            .end(done);
        })
        .catch(e => {
          done(e);
        });
  });

  it('should allow a super-admin to edit an admin\'s info', (done) => {
    const user = users[0];

    request(app)
      .patch(`/users/${user._id}`)
      .send({
        email: 'test@test.com'
      })
      .set('Authorization', 'Bearer ' + tokens.superAdminToken)
      .expect(200)
      .end(done);
  });

  it('should allow a super-admin to edit their own info', (done) => {
    const user = users[2];
    User.findById(user._id)
      .then(user => {
        request(app)
          .patch(`/users/${user._id}`)
          .send({
            email: 'test@test.com'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end(done);
      })
      .catch(e => done(e));
  });

  it('should allow an admin to edit their own info', (done) => {
    const user = users[0];
    const newEmail = 'newEmail@email.com'
    User.findById(user._id)
      .then(user => {
        request(app)
          .patch(`/users/${user._id}`)
          .send({
            email: newEmail
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .expect(res => {
            expect(res.body.email).toEqual(newEmail);
          })
          .end(done);
      })
  });
});

// GET /users
describe('GET /users', () => {
  it('should return a 200 and array of users', done => {
    request(app)
      .get('/users')
      .set('Authorization', 'Bearer ' + tokens.adminToken)
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

  it('allow an admin to set their own password', function(done) {
    this.timeout(8000);

    const userOne = users[0];
    const newPassword = 'newPassword';
    
    User.findById(userOne._id)
      .then(user => {
        request(app)
          .post(`/users/${user._id}/resetPassword`)
          .send({
            newPassword: newPassword
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end(() => {
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

  it('should allow a super-admin to set an admin\'s password', function(done) {
    this.timeout(8000);

    const admin = users[0];
    const superAdmin = users[2];
    const newPassword = 'newPassword';
    
    User.findById(admin._id)
      .then(user => {
        request(app)
          .post(`/users/${user._id}/resetPassword`)
          .send({
            newPassword: newPassword
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end(() => {
            User.findById(superAdmin._id)
              .then(user => {
                const newerPassword = 'evenNewerPassword';
                request(app)
                  .post(`/users/${admin._id}/set-password`)
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

  it('should not allow an admin to set another admin\'s password', function(done) {
    this.timeout(8000);

    const adminOne = users[0];
    const adminTwo = users[1];
    const newPassword = 'newPassword';
    
    User.findById(adminOne._id)
      .then(user => {
        request(app)
          .post(`/users/${user._id}/resetPassword`)
          .send({
            newPassword: newPassword
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end(() => {
            User.findById(adminTwo._id)
              .then(user => {
                const newerPassword = 'evenNewerPassword';
                request(app)
                  .post(`/users/${adminOne._id}/set-password`)
                  .send({
                    currentPassword: newPassword,
                    newPassword: newerPassword
                  })
                  .set('Authorization', 'Bearer ' + user.tokens[0].token)
                  .expect(403)
                  .end(done)
              })
              .catch(e => done(e));
          });
      })
      .catch(e => {
        done(e);
      });
    
  });

  it('should return an error for an authenticated request with wrong current password', (done) => {
    var user = users[0];
    var url = '/users/' + user._id + '/set-password';

    const err = new applicationError.PasswordIncorrectError();

    User.findById(user._id)
      .then(user => {
        request(app)
          .post(url)
          .send({
            currentPassword: 'pasword',
            newPassword: 'password123'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(400)
          .expect(res => {
            expect(typeof res).toBe('object');
            expect(res.body.message).toEqual(err.message);
          })
          .end(done);
      })
    
  });

  it('should return an error for an authenticated request with invalid id', (done) => {
    var user = users[2];
    var url = '/users/' + user._id + 'j/set-password';

    const err = new applicationError.InvalidObjectID();

    User.findById(user._id)
      .then(user => {
        request(app)
          .post(url)
          .send({
            currentPassword: 'password',
            newPassword: 'password123'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(400)
          .expect(res => {
            expect(typeof res).toBe('object');
            expect(res.body.message).toEqual(err.message);
          })
          .end(done);
      })

  });

});

describe('POST /users/reset-password', () => {

  it('should return a 404 error for an email not belonging to a user', (done) => {
    const email = 'nonexistant@email.com';

    request(app)
      .post('/users/reset-password')
      .send({
        email: email
      })
      .expect(404)
      .end(done);
  });

  it('should return an error for an invalid email', (done) => {
    const invalidEmail = 'invalidEmail';

    request(app)
      .post('/users/reset-password')
      .send({
        email: invalidEmail
      })
      .expect(400)
      .end(done);
  });

  it('should result in 200 for email belonging to user in DB', (done) => {
    const email = users[0].email;

    request(app)
      .post('/users/reset-password')
      .send({email: email})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          email: email
        })
      })
      .end(done);
  })
});

describe('POST /users/:id/resetPassword', () => {

  it('should return a 401 for unauthenticated requests', (done) => {
    const user = users[0];

    request(app)
      .post(`/users/${user._id}/resetPassword`)
      .expect(401)
      .end(done);
  });

  it('should allow an admin to change their own password', (done) => {
    const user = users[0];

    User.findById(user._id)
      .then(user => {
        request(app)
          .post(`/users/${user._id}/resetPassword`)
          .send({
            newPassword: 'potatoes'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end(done)
      })
      .catch(e => {
        done(e);
      })
  })
  
  it('should not allow an admin to change another admin\'s password', (done) => {
    const user = users[0];
    const userTwo = users[1];

    User.findById(user._id)
      .then(user => {
        request(app)
          .post(`/users/${userTwo._id}/resetPassword`)
          .send({
            newPassword: 'potatoes'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(403)
          .end(done)
      })
      .catch(e => {
        done(e);
      })
  })

  it('should allow a super-admin to change another admin\'s password', (done) => {
    const user = users[2];
    const userTwo = users[1];

    User.findById(user._id)
      .then(user => {
        request(app)
          .post(`/users/${userTwo._id}/resetPassword`)
          .send({
            newPassword: 'potatoes'
          })
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
          .expect(200)
          .end(done)
      })
      .catch(e => {
        done(e);
      })
  })

  it('should result in the new password being not equal to the old password', function(done) {
    this.timeout(8000);
    const user = users[2];

    User.findById(user._id)
      .then(user => {
        const oldPassword = user.password;
        const newPassword = 'aNewPassword';

        request(app)
          .post(`/users/${user._id}/resetPassword`)
          .send({newPassword})
          .set('Authorization', 'Bearer ' + user.tokens[0].token)
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
            });
          });
      });
  });
});