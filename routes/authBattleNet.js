const express = require("express");

const {
  createState,
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getUserInfo,
} = require("../services/battleNetOAuth");

const {
  findBattleNetIdentity,
  getOrCreateBattleNetUser,
} = require("../repositories/authBattleNet");
const { canRegisterBattleTag } = require("../config/environment");

const { saveOAuthCredentials } = require("../repositories/oauthCredentials");
const { importRetailCharactersForUser } = require("../services/importBattleNetCharacters");

const { pool } = require("../config/db");

const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// ============================================================
// LOGIN BATTLE.NET
// ============================================================

router.get("/battlenet", (req, res, next) => {
  try {
    const state = createState();

    req.session.battleNetOAuthState = state;
    req.session.battleNetOAuthStateCreatedAt = Date.now();

    const authorizationUrl = buildAuthorizationUrl(state);

    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      return res.redirect(authorizationUrl);
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// CALLBACK BATTLE.NET
// ============================================================

router.get("/battlenet/callback", async (req, res, next) => {
  try {
    const oauthError = req.query.error;

    if (oauthError) {
      return res.status(400).json({
        ok: false,
        error: "BATTLENET_OAUTH_ERROR",
        message: req.query.error_description || oauthError,
      });
    }

    const code = String(req.query.code || "");

    const returnedState = String(req.query.state || "");

    const expectedState = String(req.session.battleNetOAuthState || "");

    const createdAt = Number(req.session.battleNetOAuthStateCreatedAt || 0);

    // --------------------------------------------------------
    // Le state OAuth ne doit pas rester dans la session
    // --------------------------------------------------------

    delete req.session.battleNetOAuthState;
    delete req.session.battleNetOAuthStateCreatedAt;

    // --------------------------------------------------------
    // Validation du code
    // --------------------------------------------------------

    if (!code) {
      return res.status(400).json({
        ok: false,
        error: "MISSING_AUTHORIZATION_CODE",
      });
    }

    // --------------------------------------------------------
    // Protection CSRF OAuth
    // --------------------------------------------------------

    if (!returnedState || !expectedState || returnedState !== expectedState) {
      return res.status(400).json({
        ok: false,
        error: "INVALID_OAUTH_STATE",
      });
    }

    // --------------------------------------------------------
    // Expiration du state OAuth : 10 minutes
    // --------------------------------------------------------

    if (!createdAt || Date.now() - createdAt > 10 * 60 * 1000) {
      return res.status(400).json({
        ok: false,
        error: "OAUTH_STATE_EXPIRED",
      });
    }

    // --------------------------------------------------------
    // Echange du code contre un token Battle.net
    // --------------------------------------------------------

    const token = await exchangeAuthorizationCode(code);

    // --------------------------------------------------------
    // Identite Battle.net
    // --------------------------------------------------------

    const userInfo = await getUserInfo(token.access_token);

    const providerSubject = String(userInfo.sub || userInfo.id || "");

    if (!providerSubject) {
      throw new Error("Battle.net n'a retourne aucun identifiant utilisateur.");
    }

    const battleTag = userInfo.battletag || userInfo.battle_tag || null;

    const regionKey = String(
      process.env.BATTLENET_REGION || "us",
    ).toLowerCase();

    const existingIdentity = await findBattleNetIdentity({
      providerSubject,
      regionKey,
    });

    if (!existingIdentity && !canRegisterBattleTag(battleTag)) {
      return res.status(403).json({
        ok: false,
        error: "REGISTRATION_NOT_ALLOWED",
        message: "Ce compte Battle.net n'est pas autorise sur ce serveur.",
      });
    }

    // --------------------------------------------------------
    // Cree ou retrouve l'utilisateur Azer Compagnion
    // --------------------------------------------------------

    const auth = await getOrCreateBattleNetUser({
      providerSubject,
      regionKey,
      battleTag,
    });

    // --------------------------------------------------------
    // Stockage chiffre du token OAuth
    // --------------------------------------------------------
    //
    // Le token est chiffre AES-256-GCM par oauthCrypto.js
    // avant son insertion PostgreSQL.
    //
    // Le token brut ne doit JAMAIS etre place dans req.session.
    // --------------------------------------------------------

    await saveOAuthCredentials({
      authIdentityId: auth.authIdentityId,
      token,
    });

    // Le premier affichage doit deja connaitre le roster de ce compte. Une
    // panne ponctuelle de l'API profil ne doit toutefois pas annuler le login;
    // l'utilisateur pourra relancer la synchronisation depuis le Carnet.
    try {
      await importRetailCharactersForUser(auth.userId);
    } catch (importError) {
      console.warn(
        "Import initial Battle.net reporte :",
        importError.message,
      );
    }

    // Une nouvelle identite de session empeche de reutiliser une session
    // anonyme fixee avant le retour OAuth et efface les donnees d'un ancien
    // compte qui aurait utilise le meme navigateur.
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => (error ? reject(error) : resolve()));
    });

    // --------------------------------------------------------
    // Session Azer Compagnion
    // --------------------------------------------------------

    req.session.userId = auth.userId;

    req.session.authIdentityId = auth.authIdentityId;

    req.session.battleTag = battleTag;

    req.session.battleNetRegion = regionKey;

    req.session.authenticatedAt = Date.now();

    // --------------------------------------------------------
    // Sauvegarde de la session
    // --------------------------------------------------------

    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      const successUrl =
        process.env.BATTLENET_LOGIN_SUCCESS_URL || "/api/auth/me";

      return res.redirect(successUrl);
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// UTILISATEUR CONNECTE
// ============================================================

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `
          SELECT
            au.id,
            au.display_name,

            uai.provider_subject,
            uai.region_key,

            uai.display_name
              AS battle_tag,

            uai.last_login_at

          FROM app_users au

          JOIN user_auth_identities uai
            ON uai.user_id = au.id

          JOIN auth_provider_definitions ap
            ON ap.id = uai.provider_id

          WHERE au.id = $1
            AND ap.provider_key = 'battle-net'

          ORDER BY
            uai.last_login_at DESC NULLS LAST

          LIMIT 1
        `,
      [req.user.id],
    );

    if (result.rowCount !== 1) {
      return res.status(404).json({
        ok: false,
        error: "USER_NOT_FOUND",
      });
    }

    return res.json({
      ok: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// LOGOUT
// ============================================================

router.post("/logout", (req, res, next) => {
  if (!req.session) {
    return res.json({
      ok: true,
    });
  }

  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie(process.env.SESSION_COOKIE_NAME || "azer.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({
      ok: true,
    });
  });
});

module.exports = router;
