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


module.exports = router;
