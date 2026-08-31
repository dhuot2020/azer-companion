const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { withTransaction } = require("../lib/withTransaction");
const {
  getCharacterForUser,
  getDefaultCharacterForUser,
  setDefaultCharacterForUser,
} = require("../repositories/activeCharacter");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    let character = null;
    const sessionCharacterId = req.session.activeCharacterId;

    if (sessionCharacterId) {
      character = await getCharacterForUser(req.user.id, sessionCharacterId);
    }

    // La DB devient la source persistante. Ainsi un redemarrage Node ne fait
    // plus perdre le heros actif pendant le developpement.
    if (!character) {
      character = await getDefaultCharacterForUser(req.user.id);

      if (character) {
        req.session.activeCharacterId = character.id;
        await new Promise((resolve, reject) => {
          req.session.save((error) => (error ? reject(error) : resolve()));
        });
      } else {
        delete req.session.activeCharacterId;
      }
    }

    return res.json({ ok: true, character: character || null });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const characterId = Number.parseInt(req.body?.character_id, 10);

    if (!Number.isInteger(characterId) || characterId <= 0) {
      return res.status(400).json({
        ok: false,
        error: "INVALID_CHARACTER_ID",
        message: "character_id invalide.",
      });
    }

    const character = await withTransaction(async (client) => {
      return setDefaultCharacterForUser(req.user.id, characterId, client);
    });

    if (!character) {
      return res.status(403).json({
        ok: false,
        error: "CHARACTER_ACCESS_DENIED",
        message: "Ce personnage n'est pas accessible par cet utilisateur.",
      });
    }

    req.session.activeCharacterId = character.id;

    return req.session.save((error) => {
      if (error) return next(error);
      return res.json({ ok: true, character });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
