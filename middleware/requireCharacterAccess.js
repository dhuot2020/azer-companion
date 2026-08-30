const { userCanAccessCharacter } = require("../repositories/characters");

/**
 * Attend:
 *   req.user.id
 *   req.params.characterId
 *
 * A brancher APRES le middleware d'authentification de session.
 */
async function requireCharacterAccess(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "AUTH_REQUIRED",
        message: "Authentification requise.",
      });
    }

    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId <= 0) {
      return res.status(400).json({
        error: "INVALID_CHARACTER_ID",
        message: "Identifiant de personnage invalide.",
      });
    }

    const access = await userCanAccessCharacter({
      userId: req.user.id,
      characterId,
    });

    if (!access) {
      return res.status(403).json({
        error: "CHARACTER_ACCESS_DENIED",
        message: "Acces refuse a ce personnage.",
      });
    }

    req.characterAccess = access;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireCharacterAccess,
};
