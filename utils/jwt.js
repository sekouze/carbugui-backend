const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (account) =>
  jwt.sign(
    { accountId: account.id, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

const generateRefreshToken = (account) =>
  jwt.sign(
    { accountId: account.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// The raw refresh token never touches the database, only its hash (Session.refreshTokenHash).
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
