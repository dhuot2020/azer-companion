const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { getCharacterForUser } = require("../repositories/activeCharacter");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const characterId = req.session.activeCharacterId;

    if (!characterId) {
      return res.json({ ok: true, character: null });
    }

    const character = await getCharacterForUser(req.user.id, characterId);

    if (!character) {
      delete req.session.activeCharacterId;
      return res.json({ ok: true, character: null });
    }

    return res.json({ ok: true, character });
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

    const character = await getCharacterForUser(req.user.id, characterId);

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
