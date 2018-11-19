// SETUP EMAIL DATA
let fromField = '"The Priory" <bookings@dsj.org.uk>'

class newUserWelcome {
  constructor(options) {
    this.from = options.from ? options.from : fromField;
    this.to = options.email;
    this.subject = 'User account created';
    this.text = 'Whoa, this freaking works!';
    this.html = `
    <h1>Welcome, ${options.firstName}!<h1>
    <p>A new user account has been created for you. Please go to [insert link here] to set your password.</p>
    `
  }
};

module.exports = {
  newUserWelcome
}