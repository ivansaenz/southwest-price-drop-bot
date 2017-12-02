const Mailgun = require('mailgun-js');

const { MAILGUN_API_KEY, MAILGUN_EMAIL } = require('../constants.js');

const enabled = Boolean(MAILGUN_API_KEY && MAILGUN_EMAIL);

async function sendEmail (to, subject, message, from = MAILGUN_EMAIL) {
  if (!enabled) return false;

  const mg = getMailgun();
  const params = {
    from: 'SW Price Drop Bot <' + from + '>',
    to: to,
    subject: subject,
    text: message
  };

  console.log("from", params.from);
  console.log("to", params.to);

  mg.messages().send(params, function (error, body) {
    console.log(error);
    console.log(body);
  });
}

function getMailgun () {
  return new Mailgun({
    apiKey: MAILGUN_API_KEY,
    domain: MAILGUN_EMAIL.split('@')[1]
  });
}

module.exports = {
  enabled,
  sendEmail
};
