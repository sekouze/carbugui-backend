const prisma = require('../../../utils/prisma');
const { sanitizeAccount } = require('../../../utils/sanitize');

// GET /admin/accounts?role=DRIVER
exports.getAccounts = async (req, res) => {
  const { role, status } = req.query;

  const accounts = await prisma.account.findMany({
    where: {
      ...(role && { role }),
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, count: accounts.length, data: accounts.map(sanitizeAccount) });
};

// GET /admin/accounts/:id
exports.getAccountById = async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.params.id },
    include: { memberships: { include: { station: true } } },
  });

  if (!account) {
    return res.status(404).json({ success: false, message: 'Compte introuvable.' });
  }

  return res.status(200).json({ success: true, data: sanitizeAccount(account) });
};

// PUT /admin/accounts/:id/status
exports.updateAccountStatus = async (req, res) => {
  const { status } = req.body;

  if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'status invalide.' });
  }

  const account = await prisma.account.update({
    where: { id: req.params.id },
    data: { status },
  });

  return res.status(200).json({ success: true, message: `Compte ${status.toLowerCase()}.`, data: account });
};
