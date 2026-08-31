const { findUserById } = require("../repositories/users");

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      ok: false,
      error: "AUTH_REQUIRED",
      message: "Connexion Battle.net requise.",
    });
  }

  try {
    const user = await findUserById(req.session.userId);
    if (!user?.is_active) {
      return req.session.destroy(() => res.status(401).json({
        ok: false,
        error: "AUTH_REQUIRED",
        message: "Session utilisateur invalide ou desactivee.",
      }));
    }

    req.user = {
      id: user.id,
      displayName: user.display_name || null,
      battleTag: req.session.battleTag || null,
      region: req.session.battleNetRegion || null,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireAuth,
};
