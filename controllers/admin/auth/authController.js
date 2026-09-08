const bcrypt = require('bcryptjs');
const prisma = require('../../../utils/prisma');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../../../utils/jwt');

// POST /admin/auth/login — numéro + mot de passe
exports.login = async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({ success: false, message: 'phoneNumber et password sont requis.' });
  }

  const account = await prisma.account.findUnique({ where: { phoneNumber } });

  if (!account || account.role !== 'ADMIN' || !account.passwordHash) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
  }

  if (account.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, message: 'Ce compte est suspendu.' });
  }

  const isValid = await bcrypt.compare(password, account.passwordHash);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
  }

  const refreshToken = generateRefreshToken(account);

  await prisma.session.create({
    data: {
      accountId: account.id,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.account.update({ where: { id: account.id }, data: { lastSeenAt: new Date() } });

  return res.status(200).json({
    success: true,
    accessToken: generateAccessToken(account),
    refreshToken,
    account: { id: account.id, fullName: account.fullName, phoneNumber: account.phoneNumber, role: account.role },
  });
};

// GET /admin/auth/me
exports.getMe = async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.auth.accountId } });
  return res.status(200).json({ success: true, data: account });
};
