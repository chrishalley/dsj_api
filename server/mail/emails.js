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

module.exports = {
  sendMail,
  newUserWelcome
};