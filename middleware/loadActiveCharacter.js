const {
  getCharacterForUser,
} = require("../repositories/activeCharacter");

/**
 * Charge le personnage actif de la session, s'il existe,
 * et l'expose dans req.activeCharacter + res.locals.activeCharacter.
 *
 * Ce middleware NE BLOQUE PAS la page si aucun personnage n'est choisi.
 */
async function loadActiveCharacter(req, res, next) {
  try {
    req.activeCharacter = null;
    res.locals.activeCharacter = null;

    if (!req.session?.userId || !req.session?.activeCharacterId) {
      return next();
    }

    const character = await getCharacterForUser(
      req.session.userId,
      req.session.activeCharacterId,
    );

    if (!character) {
      delete req.session.activeCharacterId;
      return next();
    }

    req.activeCharacter = character;
    res.locals.activeCharacter = character;

    return next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loadActiveCharacter,
};
