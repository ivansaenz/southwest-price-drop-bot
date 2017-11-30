const Mailgun = require('mailgun-js');

const { DEVELOPMENT, MAILGUN_API_KEY, MAILGUN_EMAIL } = require('../constants.js');

const enabled = Boolean(MAILGUN_API_KEY && MAILGUN_EMAIL) && !DEVELOPMENT;

async function sendEmail (to, subject, message, from = MAILGUN_EMAIL) {
  if (!enabled) return false;

  const mg = getMailgun();
  const params = {
    from: 'SW Price Drop Bot &lt;' + from + '>',
    to: to,
    subject: subject,
    text: message
  };

  return new Promise(resolve => {
    mg.messages().send(params, (err, resp) => {
      resolve({
        err,
        resp
      });
    });
  });
}

function getMailgun () {
  return new Mailgun({
    apiKey: MAILGUN_API_KEY,
    domain: MAILGUN_EMAIL.split('@')[0]
  });
}

module.exports = {
  enabled,
  getMailgun,
  sendEmail
};
