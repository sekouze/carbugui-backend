const prisma = require('../../../utils/prisma');

// GET /admin/chat/threads?status=ESCALATED
exports.getThreads = async (req, res) => {
  const { status } = req.query;

  const threads = await prisma.chatThread.findMany({
    where: { ...(status && { status }) },
    include: { account: true },
    orderBy: { updatedAt: 'desc' },
  });

  return res.status(200).json({ success: true, count: threads.length, data: threads });
};

// GET /admin/chat/threads/:id/messages
exports.getMessages = async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { threadId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });

  return res.status(200).json({ success: true, data: messages });
};

// POST /admin/chat/threads/:id/messages — un agent répond depuis le dashboard
exports.sendMessage = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'text est requis.' });
  }

  const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Conversation introuvable.' });
  }

  const message = await prisma.chatMessage.create({
    data: { threadId: thread.id, role: 'AGENT', text },
  });

  await prisma.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

  return res.status(201).json({ success: true, data: message });
};

// PUT /admin/chat/threads/:id/close
exports.closeThread = async (req, res) => {
  const thread = await prisma.chatThread.update({
    where: { id: req.params.id },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  return res.status(200).json({ success: true, data: thread });
};
