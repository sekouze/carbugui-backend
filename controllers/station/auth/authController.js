const bcrypt = require('bcryptjs');
const prisma = require('../../../utils/prisma');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../../../utils/jwt');

// POST /station/auth/login — code + mot de passe (compte créé par un admin)
exports.login = async (req, res) => {
  const { loginCode, password } = req.body;

  if (!loginCode || !password) {
    return res.status(400).json({ success: false, message: 'loginCode et password sont requis.' });
  }

  const account = await prisma.account.findUnique({
    where: { loginCode },
    include: { memberships: { include: { station: true } } },
  });

  if (!account || !account.passwordHash) {
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
      deviceId: req.body.deviceId || null,
      platform: req.body.platform || null,
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.account.update({ where: { id: account.id }, data: { lastSeenAt: new Date() } });

  return res.status(200).json({
    success: true,
    accessToken: generateAccessToken(account),
    refreshToken,
    account,
  });
};

// PUT /station/auth/password
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const account = await prisma.account.findUnique({ where: { id: req.auth.accountId } });

  const isValid = await bcrypt.compare(currentPassword || '', account.passwordHash || '');
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect.' });
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  return res.status(200).json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
};
