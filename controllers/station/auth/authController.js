const bcrypt = require('bcryptjs');
const prisma = require('../../../utils/prisma');
const { normalizeGuineaPhone } = require('../../../utils/functions');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../../../utils/jwt');
const { sanitizeAccount } = require('../../../utils/sanitize');

const MIN_PASSWORD_LENGTH = 6;

// POST /station/auth/register — un gérant réclame une station du catalogue ;
// le compte naît PENDING et doit être validé par un admin avant toute écriture.
exports.register = async (req, res) => {
  const { stationId, fullName, phoneNumber, password } = req.body;

  if (!stationId) {
    return res.status(400).json({ success: false, message: 'stationId est requis.' });
  }

  if (!fullName || fullName.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Entrez votre nom complet.' });
  }

  const normalizedPhone = normalizeGuineaPhone(phoneNumber);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: 'Entrez un numéro guinéen valide (9 chiffres, débutant par 6 ou 7).',
    });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    });
  }

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    return res.status(404).json({ success: false, message: 'Station introuvable.' });
  }

  // Le login code d'un compte station est toujours le slug de sa station
  // (même convention que la création par un admin) : un slug déjà pris veut
  // dire que la station a déjà un compte, en attente ou actif.
  const existingAccount = await prisma.account.findUnique({ where: { loginCode: station.slug } });
  if (existingAccount) {
    return res.status(409).json({ success: false, message: 'Une demande existe déjà pour cette station.' });
  }

  const existingPhone = await prisma.account.findUnique({ where: { phoneNumber: normalizedPhone } });
  if (existingPhone) {
    return res.status(409).json({ success: false, message: 'Ce numéro est déjà associé à un compte existant.' });
  }

  const account = await prisma.account.create({
    data: {
      role: 'STATION',
      status: 'PENDING',
      loginCode: station.slug,
      phoneNumber: normalizedPhone,
      fullName: fullName.trim(),
      passwordHash: await bcrypt.hash(password, 12),
      memberships: { create: { stationId: station.id, role: 'OWNER' } },
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Votre demande a été envoyée. Un administrateur doit valider votre compte avant que vous puissiez modifier les statuts.',
    data: { accountId: account.id, loginCode: account.loginCode, status: account.status },
  });
};

// POST /station/auth/login — code + mot de passe. Un compte PENDING (encore
// non validé par un admin) reçoit quand même ses tokens : c'est le statut
// renvoyé qui met le dashboard en lecture seule côté client.
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

  if (account.status === 'SUSPENDED' || account.status === 'DELETED') {
    return res.status(403).json({ success: false, message: 'Ce compte est suspendu ou supprimé.' });
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
    account: sanitizeAccount(account),
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

// GET /station/auth/me — relit le statut à chaque lancement (PENDING → ACTIVE
// une fois l'admin passé) ; un 404 côté client signifie simplement "route pas
// encore déployée", donc garder la valeur en cache.
exports.getMe = async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.auth.accountId },
    include: { memberships: { include: { station: true } } },
  });

  return res.status(200).json({ success: true, account: sanitizeAccount(account) });
};
