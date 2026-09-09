/**
 * À utiliser après `auth` sur les routes d'écriture accessibles à un compte
 * PENDING en lecture seule (ex. dashboard station). `auth` laisse déjà
 * passer un compte PENDING pour que les lectures fonctionnent ; ce middleware
 * ferme les écritures tant qu'un administrateur n'a pas activé le compte.
 */
const requireApprovedAccount = (req, res, next) => {
  if (req.account.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: "Votre compte n'est pas encore validé par un administrateur.",
    });
  }

  next();
};

module.exports = { requireApprovedAccount };
