const {
  getCharacterForUser,
  getDefaultCharacterForUser,
} = require("../repositories/activeCharacter");
const { findUserById } = require("../repositories/users");

async function loadActiveCharacter(req, res, next) {
  try {
    req.activeCharacter = null;
    res.locals.activeCharacter = null;

    if (!req.session?.userId) {
      return next();
    }

    const user = await findUserById(req.session.userId);
    if (!user?.is_active) {
      delete req.session.userId;
      delete req.session.activeCharacterId;
      return next();
    }

    let character = null;

    if (req.session.activeCharacterId) {
      character = await getCharacterForUser(
        req.session.userId,
        req.session.activeCharacterId,
      );
    }

    if (!character) {
      character = await getDefaultCharacterForUser(req.session.userId);
      if (character) {
        req.session.activeCharacterId = character.id;
      } else {
        delete req.session.activeCharacterId;
      }
    }

    req.activeCharacter = character || null;
    res.locals.activeCharacter = character || null;

    return next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loadActiveCharacter,
};
