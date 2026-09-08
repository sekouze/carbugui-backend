const crypto = require('crypto');

const generateRandomString = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateOtpCode = () => crypto.randomInt(100000, 999999).toString();

module.exports = {
  generateRandomString,
  generateOtpCode,
};
