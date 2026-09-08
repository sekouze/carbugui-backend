const prisma = require('../utils/prisma');

/**
 * À utiliser après `auth, requireRole('STATION')`. Vérifie que le compte
 * connecté est bien membre (OWNER ou STAFF) de la station ciblée par
 * `req.params.stationId` (ou `req.body.stationId`), et attache la
 * membership + la station à la requête.
 */
const requireStationAccess = async (req, res, next) => {
  try {
    const stationId = req.params.stationId || req.body.stationId;

    if (!stationId) {
      return res.status(400).json({ success: false, message: 'stationId est requis.' });
    }

    const membership = await prisma.stationMembership.findUnique({
      where: { accountId_stationId: { accountId: req.auth.accountId, stationId } },
      include: { station: true },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas accès à cette station.",
      });
    }

    req.stationMembership = membership;
    req.station = membership.station;

    next();
  } catch (error) {
    console.error('requireStationAccess error:', error);
    return res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

module.exports = { requireStationAccess };
