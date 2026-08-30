const express = require("express");

const {
  requireAuth,
} = require("../middleware/requireAuth");

const {
  getCharacterForUser,
} = require("../repositories/activeCharacter");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const characterId =
      req.session.activeCharacterId;

    if (!characterId) {
      return res.json({
        ok: true,
        character: null,
      });
    }

    const character =
      await getCharacterForUser(
        req.user.id,
        characterId,
      );

    if (!character) {
      delete req.session.activeCharacterId;

      return res.json({
        ok: true,
        character: null,
      });
    }

    return res.json({
      ok: true,
      character,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
