const prisma = require('./prisma');
const { generateAccessToken, generateRefreshToken, hashToken } = require('./jwt');

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Opens a new device session (Session row + token pair). Shared by every
// login path (OTP, refresh, PIN) so "still has a valid session" always means
// the same thing everywhere.
const createSession = async (account, req) => {
  const refreshToken = generateRefreshToken(account);

  await prisma.session.create({
    data: {
      accountId: account.id,
      refreshTokenHash: hashToken(refreshToken),
      deviceId: req.body.deviceId || null,
      deviceName: req.body.deviceName || null,
      platform: req.body.platform || null,
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return { accessToken: generateAccessToken(account), refreshToken };
};

module.exports = { createSession };
