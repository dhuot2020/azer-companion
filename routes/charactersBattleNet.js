// ============================================================
// ROUTE CHARACTERS - VERSION PROPRE
// Remplace routes/charactersBattleNet.js
// ============================================================

const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");

const {
  importRetailCharactersForUser,
} = require("../services/importBattleNetCharacters");

const {
  listCharactersForUser,
} = require("../repositories/characters");

const { getCharacterForUser } = require("../repositories/activeCharacter");
const { getActiveAccessTokenForUser } = require("../repositories/oauthCredentials");
const { getBattleNetCharacterEquipment } = require("../services/battleNetCharacterEquipment");

const router = express.Router();


// ============================================================
// LISTE DES PERSONNAGES AUTORISES
// ============================================================

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const characters = await listCharactersForUser(
      req.user.id
    );

    return res.json({
      ok: true,
      count: characters.length,
      characters,
    });
  } catch (error) {
    next(error);
  }
});


// ============================================================
// SYNCHRONISATION BATTLE.NET
// ============================================================

router.post(
  "/import/battlenet",
  requireAuth,
  async (req, res, next) => {
    try {
      const result =
        await importRetailCharactersForUser(
          req.user.id
        );

      return res.json({
        ok: true,
        ...result,
      });
    } catch (error) {
      if (
        error.code ===
        "BATTLENET_REAUTH_REQUIRED"
      ) {
        return res.status(401).json({
          ok: false,
          error: error.code,
          message: error.message,
          login_url:
            "/api/auth/battlenet",
        });
      }

      next(error);
    }
  },
);

// ============================================================
// EQUIPEMENT BATTLE.NET DU PERSONNAGE
// ============================================================

router.get(
  "/:characterId/equipment",
  requireAuth,
  async (req, res, next) => {
    try {
      const characterId = Number.parseInt(req.params.characterId, 10);
      if (!Number.isInteger(characterId) || characterId <= 0) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_CHARACTER_ID",
        });
      }

      const character = await getCharacterForUser(req.user.id, characterId);
      if (!character) {
        return res.status(403).json({
          ok: false,
          error: "CHARACTER_ACCESS_DENIED",
        });
      }

      const credential = await getActiveAccessTokenForUser(req.user.id);
      if (!credential || credential.expired || !credential.accessToken) {
        return res.status(401).json({
          ok: false,
          error: "BATTLENET_REAUTH_REQUIRED",
          login_url: "/api/auth/battlenet",
        });
      }

      const hero = await getBattleNetCharacterEquipment(
        character,
        credential.accessToken,
      );

      return res.json({
        ok: true,
        hero,
      });
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({
          ok: false,
          error: "BATTLENET_REAUTH_REQUIRED",
          login_url: "/api/auth/battlenet",
        });
      }
      next(error);
    }
  },
);


module.exports = router;
