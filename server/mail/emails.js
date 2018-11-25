// SETUP EMAIL DATA
const {mailgunConfig} = require('./../config/mailgun.config.js');
const mailgun = require('mailgun-js')(mailgunConfig);

let fromField = 'The Priory <bookings@dsj.org.uk>'

const sendMail = (message) => {
    new Promise((resolve, reject) => {
      const data = {
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        inline: message.attachment,
        html: message.html
      };

      mailgun.messages().send(data, (error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
}

class newUserWelcome {
  constructor(options) {
    this.from = fromField;
    this.to = options.user.email;
    this.subject = 'User account created';
    this.text = 
    `Welcome, ${options.user.firstName}!\n
    A new user account has been created for you. Please go to [insert link here] to set your password.`;
    this.html = `
    <h1>Welcome, ${options.user.firstName}!<h1>
    <p>A new user account has been created for you. Please go to [insert link here] to set your password.</p>`;
    this.attachment = null;
  }
};

class forgotPasswordReset {
  constructor(options) {
    this.from = fromField;
    this.to = options.user.email;
    this.subject = 'Forgot your password?';
    this.text = 
    `Hi, ${options.user.firstName}!\n
    Looks like you've forgotten your password! Don't worry, just follow the link below and we'll let you choose a new one.`;
    this.html = `
    <h1>Hi, ${options.user.firstName}!<h1>
    <p>Looks like you've forgotten your password! Don't worry, just follow the link below and we'll let you choose a new one.</p>
    <a href="${options.resetURL}" rel="noopener">Password reset link</a>
    <p>If you didn't request to reset your password, please let us know at [insert address here]</p>
    `;
    this.attachment = null;
  }
};

module.exports = {
  sendMail,
  newUserWelcome,
  forgotPasswordReset
};