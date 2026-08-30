require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

// ============================================================
// CONFIGURATION
// ============================================================

const {
  getPort,
  getSessionCookieOptions,
  getSessionSecret,
  isProduction,
} = require("./config/environment");

const { testConnection } = require("./config/db");

// ============================================================
// ROUTES
// ============================================================

const dbHealthRouter = require("./routes/dbHealth");

const battleNetAuthRouter = require("./routes/authBattleNet");

const charactersBattleNetRouter = require("./routes/charactersBattleNet");

const activeCharacterRouter = require("./routes/activeCharacter");

const carnetRouter = require("./routes/carnet");

// ============================================================
// APPLICATION
// ============================================================

const app = express();

const PORT = getPort();

// ============================================================
// PROXY / NGINX / CLOUDFLARE
// ============================================================

if (isProduction()) {
  // HTTPS sera termine par Nginx / Cloudflare.
  app.set("trust proxy", 1);
}

// ============================================================
// SESSION
// ============================================================
//
// IMPORTANT :
//
// express-session doit obligatoirement etre initialise
// AVANT les routes:
//   /api/auth
//   /api/characters
//
// ============================================================

app.use(
  session({
    name: process.env.SESSION_COOKIE_NAME || "azer.sid",

    secret: getSessionSecret(),

    resave: false,

    saveUninitialized: false,

    cookie: getSessionCookieOptions(),
  }),
);

// ============================================================
// EJS
// ============================================================

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

// ============================================================
// STATIC
// ============================================================

app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// BODY PARSING
// ============================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ============================================================
// DATABASE HEALTH
// ============================================================
//
// GET
// /api/db/health
//
// ============================================================

app.use("/api/db", dbHealthRouter);

// ============================================================
// BATTLE.NET OAUTH
// ============================================================
//
// GET
// /api/auth/battlenet
//
// GET
// /api/auth/battlenet/callback
//
// GET
// /api/auth/me
//
// POST
// /api/auth/logout
//
// ============================================================

app.use("/api/auth", battleNetAuthRouter);

// ============================================================
// PERSONNAGE ACTIF
// ============================================================
//
// GET
// /api/characters/active
//
// POST
// /api/characters/active
//
// ============================================================

app.use("/api/characters/active", activeCharacterRouter);

// ============================================================
// PERSONNAGES BATTLE.NET
// ============================================================
//
// GET
// /api/characters
//
// POST
// /api/characters/import/battlenet
//
// ============================================================

app.use("/api/characters", charactersBattleNetRouter);

// ============================================================
// AZER COMPAGNION
// ============================================================

app.use("/", carnetRouter);

// ============================================================
// TEST POSTGRESQL
// ============================================================

testConnection();

// ============================================================
// DEMARRAGE SERVEUR
// ============================================================

const server = app.listen(PORT, (error) => {
  if (error) {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Le port ${PORT} est déjà utilisé. ` +
          `Arrête l'ancien serveur ou définis un autre port.`,
      );
    } else {
      console.error("Impossible de démarrer le serveur :", error);
    }

    process.exitCode = 1;

    return;
  }

  console.log(`
=========================================
             AZER COMPANION
              par DH Studio
=========================================

Serveur démarré :
http://localhost:${PORT}

Battle.net OAuth :
http://localhost:${PORT}/api/auth/battlenet

Utilisateur connecté :
http://localhost:${PORT}/api/auth/me

Personnage actif :
http://localhost:${PORT}/api/characters/active

Personnages :
http://localhost:${PORT}/api/characters

Database Health :
http://localhost:${PORT}/api/db/health

Que l'aventure continue.
    `);
});

// ============================================================
// ARRET SERVEUR
// ============================================================

server.on("close", () => {
  console.log("Serveur Azer Companion arrêté.");
});
