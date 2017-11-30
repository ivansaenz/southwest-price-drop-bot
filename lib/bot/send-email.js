const Mailgun = require('mailgun');

const { DEVELOPMENT, MAILGUN_API_KEY, MAILGUN_EMAIL } = require('../constants.js');

const enabled = Boolean(MAILGUN_API_KEY && MAILGUN_EMAIL) && !DEVELOPMENT;

async function sendEmail (to, subject, message, from = MAILGUN_EMAIL) {
  if (!enabled) return false;

  const mg = getMailgun();

  return new Promise(resolve => {
    mg.sendText(from, to, subject, message, (err) => {
      resolve({
        err
      });
    });
  });
}

function getMailgun () {
  return new Mailgun(MAILGUN_API_KEY);
}

module.exports = {
  enabled,
  getMailgun,
  sendEmail
};
