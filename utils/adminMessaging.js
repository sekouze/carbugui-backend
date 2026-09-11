const prisma = require('./prisma');
const { sendSMS } = require('./sms');

/**
 * Sends every still-PENDING recipient of one AdminMessage, then marks the
 * message SENT. Shared by the immediate-send path (POST /admin/messages,
 * called synchronously right after creating the recipient rows) and by
 * dispatchDueScheduledMessages (the poller in server.js).
 */
const dispatchMessage = async (messageId) => {
  const message = await prisma.adminMessage.findUnique({ where: { id: messageId } });

  if (!message || message.status !== 'SCHEDULED') {
    return message;
  }

  const pending = await prisma.adminMessageRecipient.findMany({
    where: { messageId, status: 'PENDING' },
  });

  await Promise.allSettled(
    pending.map((recipient) =>
      sendSMS({ to: recipient.phoneNumber, message: message.body })
        .then(() => prisma.adminMessageRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', sentAt: new Date() },
        }))
        .catch((error) => prisma.adminMessageRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', error: String(error.message || error).slice(0, 191) },
        }))
    )
  );

  return prisma.adminMessage.update({
    where: { id: messageId },
    data: { status: 'SENT', dispatchedAt: new Date() },
  });
};

/**
 * Polled on an interval by server.js — dispatches every AdminMessage still
 * SCHEDULED whose scheduledAt has arrived. Naturally self-healing: an
 * immediate send interrupted mid-request, or a scheduled one missed while
 * the server was down, both just look like "due" on the next pass.
 */
const dispatchDueScheduledMessages = async () => {
  const due = await prisma.adminMessage.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    select: { id: true },
  });

  for (const { id } of due) {
    await dispatchMessage(id).catch((error) => console.error(`dispatchMessage(${id}) failed:`, error));
  }

  return due.length;
};

module.exports = { dispatchMessage, dispatchDueScheduledMessages };
