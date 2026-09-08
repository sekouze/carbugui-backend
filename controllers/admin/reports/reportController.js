const prisma = require('../../../utils/prisma');

// GET /admin/reports?status=PENDING
exports.getReports = async (req, res) => {
  const { status } = req.query;

  const reports = await prisma.stationReport.findMany({
    where: { ...(status && { status }) },
    include: { station: true, account: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, count: reports.length, data: reports });
};

// PUT /admin/reports/:id
exports.resolveReport = async (req, res) => {
  const { status } = req.body;

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'status doit être ACCEPTED ou REJECTED.' });
  }

  const report = await prisma.stationReport.update({
    where: { id: req.params.id },
    data: { status, resolvedAt: new Date() },
  });

  return res.status(200).json({ success: true, data: report });
};
