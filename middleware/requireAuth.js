function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      ok: false,
      error: "AUTH_REQUIRED",
      message: "Connexion Battle.net requise.",
    });
  }

  req.user = {
    id: req.session.userId,
    battleTag: req.session.battleTag || null,
    region: req.session.battleNetRegion || null,
  };

  next();
}

module.exports = {
  requireAuth,
};
