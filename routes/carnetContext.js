const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getCharacterForUser,
  getDefaultCharacterForUser,
} = require("../repositories/activeCharacter");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    let character = null;

    if (req.session.activeCharacterId) {
      character = await getCharacterForUser(
        req.user.id,
        req.session.activeCharacterId,
      );
    }

    if (!character) {
      character = await getDefaultCharacterForUser(req.user.id);
      if (character) {
        req.session.activeCharacterId = character.id;
      } else {
        delete req.session.activeCharacterId;
      }
    }

    return res.json({
      ok: true,
      character: character || null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
