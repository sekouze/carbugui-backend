const prisma = require('../../../utils/prisma');
const { matchIntent } = require('../../../utils/chatBot');

// GET /app/chat/threads
exports.getMyThreads = async (req, res) => {
  const threads = await prisma.chatThread.findMany({
    where: { accountId: req.auth.accountId },
    orderBy: { updatedAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: threads });
};

// POST /app/chat/threads — réutilise le fil OPEN existant, sinon en crée un
exports.openThread = async (req, res) => {
  let thread = await prisma.chatThread.findFirst({
    where: { accountId: req.auth.accountId, status: { in: ['OPEN', 'ESCALATED'] } },
    orderBy: { updatedAt: 'desc' },
  });

  if (!thread) {
    thread = await prisma.chatThread.create({ data: { accountId: req.auth.accountId } });
  }

  return res.status(200).json({ success: true, data: thread });
};

// GET /app/chat/threads/:id/messages
exports.getMessages = async (req, res) => {
  const thread = await prisma.chatThread.findFirst({
    where: { id: req.params.id, accountId: req.auth.accountId },
  });

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Conversation introuvable.' });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
  });

  return res.status(200).json({ success: true, data: messages });
};

// POST /app/chat/threads/:id/messages
exports.sendMessage = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'text est requis.' });
  }

  const thread = await prisma.chatThread.findFirst({
    where: { id: req.params.id, accountId: req.auth.accountId },
  });

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Conversation introuvable.' });
  }

  const userMessage = await prisma.chatMessage.create({
    data: { threadId: thread.id, role: 'USER', text },
  });

  const replies = [userMessage];

  if (thread.status === 'OPEN') {
    const intent = matchIntent(text);

    if (intent && intent.reply) {
      const botMessage = await prisma.chatMessage.create({
        data: { threadId: thread.id, role: 'BOT', text: intent.reply, intentId: intent.id },
      });
      replies.push(botMessage);
    } else {
      await prisma.chatThread.update({ where: { id: thread.id }, data: { status: 'ESCALATED', escalatedAt: new Date() } });
      const botMessage = await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'BOT',
          text: 'Je transmets votre demande à un agent, il vous répondra sur WhatsApp très vite.',
          intentId: 'escalate',
        },
      });
      replies.push(botMessage);
    }
  }

  await prisma.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

  return res.status(201).json({ success: true, data: replies });
};

// POST /app/chat/threads/:id/close
exports.closeThread = async (req, res) => {
  const thread = await prisma.chatThread.updateMany({
    where: { id: req.params.id, accountId: req.auth.accountId },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  if (thread.count === 0) {
    return res.status(404).json({ success: false, message: 'Conversation introuvable.' });
  }

  return res.status(200).json({ success: true, message: 'Conversation clôturée.' });
};
