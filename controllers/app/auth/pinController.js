const bcrypt = require('bcryptjs');
const prisma = require('../../../utils/prisma');
const { generateOtpCode, normalizeGuineaPhone } = require('../../../utils/functions');
const { sendOtpCode } = require('../../../utils/sms');
const { verifyRefreshToken, hashToken } = require('../../../utils/jwt');
const { createSession } = require('../../../utils/session');
const { sanitizeAccount } = require('../../../utils/sanitize');

const PIN_REGEX = /^\d{4,6}$/;
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MINUTES = 15;
const OTP_TTL_MINUTES = 10;

// POST /app/auth/pin/set — (ré)initialise le code PIN. Protégé par le
// accessToken déjà obtenu via l'OTP : pas besoin de redemander le code actuel.
exports.setPin = async (req, res) => {
  const { pin } = req.body;

  if (!pin || !PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, message: 'Le code PIN doit contenir 4 à 6 chiffres.' });
  }

  const account = await prisma.account.update({
    where: { id: req.auth.accountId },
    data: {
      pinHash: await bcrypt.hash(pin, 10),
      pinAttempts: 0,
      pinLockedUntil: null,
    },
  });

  return res.status(200).json({ success: true, message: 'Code PIN enregistré.', data: { hasPin: Boolean(account.pinHash) } });
};

// POST /app/auth/pin/login — remplace l'OTP par SMS tant que la session
// (refreshToken) fournie est toujours valide : aucun SMS n'est envoyé ici.
exports.pinLogin = async (req, res) => {
  const { refreshToken, pin } = req.body;

  if (!refreshToken || !pin) {
    return res.status(400).json({ success: false, message: 'refreshToken et pin sont requis.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expirée. Reconnectez-vous par SMS.' });
  }

  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return res.status(401).json({ success: false, message: 'Session expirée. Reconnectez-vous par SMS.' });
  }

  const account = await prisma.account.findUnique({ where: { id: decoded.accountId } });

  if (!account || account.status !== 'ACTIVE') {
    return res.status(401).json({ success: false, message: 'Compte introuvable ou suspendu.' });
  }

  if (!account.pinHash) {
    return res.status(400).json({ success: false, message: 'Aucun code PIN configuré. Reconnectez-vous par SMS puis définissez-en un.' });
  }

  if (account.pinLockedUntil && account.pinLockedUntil > new Date()) {
    return res.status(429).json({
      success: false,
      message: 'Trop de tentatives. Réessayez plus tard ou réinitialisez votre code PIN.',
    });
  }

  const isValid = await bcrypt.compare(pin, account.pinHash);

  if (!isValid) {
    const attempts = account.pinAttempts + 1;
    const lockedOut = attempts >= PIN_MAX_ATTEMPTS;

    await prisma.account.update({
      where: { id: account.id },
      data: {
        pinAttempts: lockedOut ? 0 : attempts,
        pinLockedUntil: lockedOut ? new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000) : null,
      },
    });

    return res.status(401).json({
      success: false,
      message: lockedOut
        ? 'Trop de tentatives. Réessayez plus tard ou réinitialisez votre code PIN.'
        : 'Code PIN incorrect.',
    });
  }

  // Rotation de session, comme /app/auth/refresh : la session consommée est
  // révoquée et remplacée, le refreshToken côté client doit être mis à jour.
  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

  await prisma.account.update({
    where: { id: account.id },
    data: { pinAttempts: 0, pinLockedUntil: null, lastSeenAt: new Date() },
  });

  const tokens = await createSession(account, req);

  return res.status(200).json({
    success: true,
    account: sanitizeAccount({ ...account, pinAttempts: 0, pinLockedUntil: null }),
    ...tokens,
  });
};

// POST /app/auth/pin/forgot — envoie un code de confirmation SMS pour
// réinitialiser le PIN. Seul ce flux ré-consomme un SMS, volontairement rare.
exports.forgotPin = async (req, res) => {
  const normalizedPhone = normalizeGuineaPhone(req.body.phoneNumber);

  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: 'Entrez un numéro guinéen valide (9 chiffres, débutant par 6 ou 7).',
    });
  }

  const account = await prisma.account.findUnique({ where: { phoneNumber: normalizedPhone } });

  if (!account) {
    return res.status(404).json({ success: false, message: 'Aucun compte trouvé pour ce numéro.' });
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.otpChallenge.create({
    data: {
      phoneNumber: normalizedPhone,
      purpose: 'PIN_RESET',
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      ipAddress: req.ip,
    },
  });

  await sendOtpCode(normalizedPhone, code, 'PIN_RESET');

  return res.status(200).json({ success: true, message: `Code envoyé au ${normalizedPhone}.` });
};

// POST /app/auth/pin/reset — vérifie le code SMS puis pose le nouveau PIN.
exports.resetPin = async (req, res) => {
  const { code, pin } = req.body;
  const normalizedPhone = normalizeGuineaPhone(req.body.phoneNumber);

  if (!normalizedPhone || !code) {
    return res.status(400).json({ success: false, message: 'phoneNumber et code sont requis.' });
  }

  if (!pin || !PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, message: 'Le code PIN doit contenir 4 à 6 chiffres.' });
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: { phoneNumber: normalizedPhone, purpose: 'PIN_RESET', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    return res.status(400).json({ success: false, message: 'Aucun code en attente pour ce numéro.' });
  }

  if (challenge.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Ce code a expiré.' });
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return res.status(429).json({ success: false, message: 'Trop de tentatives. Redemandez un code.' });
  }

  const isValid = await bcrypt.compare(code, challenge.codeHash);

  if (!isValid) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ success: false, message: 'Code incorrect.' });
  }

  const account = await prisma.account.findUnique({ where: { phoneNumber: normalizedPhone } });

  if (!account) {
    return res.status(404).json({ success: false, message: 'Compte introuvable.' });
  }

  await prisma.$transaction([
    prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } }),
    prisma.account.update({
      where: { id: account.id },
      data: { pinHash: await bcrypt.hash(pin, 10), pinAttempts: 0, pinLockedUntil: null },
    }),
  ]);

  return res.status(200).json({ success: true, message: 'Code PIN mis à jour avec succès.' });
};
