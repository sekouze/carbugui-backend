const prisma = require('../../../utils/prisma');
const { dispatchMessage } = require('../../../utils/adminMessaging');

const RECIPIENT_ROLES = ['DRIVER', 'STATION'];
const MAX_RECIPIENTS = 1000; // Maximum number of recipients per message
const MAX_BODY_LENGTH = 500;
const MIN_SCHEDULE_LEAD_MS = 60 * 1000;

// POST /admin/messages — SMS personnalisé à une liste choisie de comptes
// DRIVER/STATION, envoyé immédiatement ou programmé (scheduledAt). L'envoi
// est tracé par destinataire : un numéro invalide ne doit jamais masquer que
// les autres textos sont bien partis.
exports.sendMessage = async (req, res) => {
  const { accountIds, body, scheduledAt } = req.body;
  const text = typeof body === 'string' ? body.trim() : '';

  if (!Array.isArray(accountIds) || accountIds.length === 0) {
    return res.status(400).json({ success: false, message: 'accountIds doit contenir au moins un identifiant de compte.' });
  }

  if (!text) {
    return res.status(400).json({ success: false, message: 'body est requis.' });
  }

  if (text.length > MAX_BODY_LENGTH) {
    return res.status(400).json({ success: false, message: `Le message ne peut pas dépasser ${MAX_BODY_LENGTH} caractères.` });
  }

  let scheduledDate;
  if (scheduledAt) {
    scheduledDate = new Date(scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, message: 'scheduledAt doit être une date ISO valide.' });
    }

    if (scheduledDate.getTime() < Date.now() + MIN_SCHEDULE_LEAD_MS) {
      return res.status(400).json({ success: false, message: 'scheduledAt doit être au moins 1 minute dans le futur.' });
    }
  }

  const uniqueIds = [...new Set(accountIds)];

  if (uniqueIds.length > MAX_RECIPIENTS) {
    return res.status(400).json({ success: false, message: `Maximum ${MAX_RECIPIENTS} destinataires par envoi.` });
  }

  const foundAccounts = await prisma.account.findMany({ where: { id: { in: uniqueIds } } });
  const foundIds = new Set(foundAccounts.map((a) => a.id));

  const notFoundIds = uniqueIds.filter((id) => !foundIds.has(id));
  const targetAccounts = foundAccounts.filter((a) => RECIPIENT_ROLES.includes(a.role));
  const wrongRoleIds = foundAccounts.filter((a) => !RECIPIENT_ROLES.includes(a.role)).map((a) => a.id);

  if (targetAccounts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Aucun destinataire valide (comptes DRIVER ou STATION uniquement).',
      notFoundIds,
      wrongRoleIds,
    });
  }

  const adminMessage = await prisma.adminMessage.create({
    data: {
      senderId: req.auth.accountId,
      body: text,
      ...(scheduledDate && { scheduledAt: scheduledDate }),
    },
  });

  await Promise.all(
    targetAccounts.map((account) =>
      prisma.adminMessageRecipient.create({
        data: {
          messageId: adminMessage.id,
          accountId: account.id,
          phoneNumber: account.phoneNumber,
          status: account.phoneNumber ? 'PENDING' : 'SKIPPED',
          error: account.phoneNumber ? null : 'Aucun numéro enregistré pour ce compte.',
        },
      })
    )
  );

  // Un envoi immédiat se déclenche tout de suite ; un envoi programmé attend
  // le prochain passage du planificateur (dispatchDueScheduledMessages).
  if (!scheduledDate) {
    await dispatchMessage(adminMessage.id);
  }

  const finalMessage = await prisma.adminMessage.findUnique({
    where: { id: adminMessage.id },
    include: {
      recipients: { include: { account: { select: { id: true, fullName: true, phoneNumber: true, role: true } } } },
    },
  });

  const counts = { PENDING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 };
  finalMessage.recipients.forEach((r) => { counts[r.status] += 1; });

  return res.status(201).json({
    success: true,
    message: scheduledDate
      ? `Message programmé pour le ${scheduledDate.toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC.`
      : 'Envoi terminé.',
    data: { ...finalMessage, counts, notFoundIds, wrongRoleIds },
  });
};

// PUT /admin/messages/:id/cancel — uniquement pour un envoi pas encore dispatché.
exports.cancelMessage = async (req, res) => {
  const message = await prisma.adminMessage.findUnique({ where: { id: req.params.id } });

  if (!message) {
    return res.status(404).json({ success: false, message: 'Message introuvable.' });
  }

  if (message.status !== 'SCHEDULED') {
    return res.status(400).json({ success: false, message: 'Seul un message encore programmé peut être annulé.' });
  }

  const canceled = await prisma.adminMessage.update({
    where: { id: message.id },
    data: { status: 'CANCELED' },
  });

  return res.status(200).json({ success: true, message: 'Envoi programmé annulé.', data: canceled });
};

// GET /admin/messages?status=SCHEDULED
exports.getMessages = async (req, res) => {
  const { status } = req.query;

  const messages = await prisma.adminMessage.findMany({
    where: { ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      sender: { select: { id: true, fullName: true } },
      recipients: { select: { status: true } },
    },
  });

  const data = messages.map(({ recipients, ...message }) => {
    const counts = { PENDING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 };
    recipients.forEach((r) => { counts[r.status] += 1; });
    return { ...message, recipientCount: recipients.length, counts };
  });

  return res.status(200).json({ success: true, count: data.length, data });
};

// GET /admin/messages/:id
exports.getMessageById = async (req, res) => {
  const message = await prisma.adminMessage.findUnique({
    where: { id: req.params.id },
    include: {
      sender: { select: { id: true, fullName: true } },
      recipients: { include: { account: { select: { id: true, fullName: true, phoneNumber: true, role: true } } } },
    },
  });

  if (!message) {
    return res.status(404).json({ success: false, message: 'Message introuvable.' });
  }

  return res.status(200).json({ success: true, data: message });
};
