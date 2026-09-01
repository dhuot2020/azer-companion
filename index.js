require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const { PostgresSessionStore } = require("./middleware/postgresSessionStore");

// ============================================================
// CONFIGURATION
// ============================================================

const {
  getPort,
  getSessionCookieOptions,
  getSessionSecret,
  isProduction,
  validateProductionConfig,
} = require("./config/environment");

const { pool, assertDatabaseReady } = require("./config/db");

// ============================================================
// ROUTES
// ============================================================

const dbHealthRouter = require("./routes/dbHealth");

const battleNetAuthRouter = require("./routes/authBattleNet");

const charactersBattleNetRouter = require("./routes/charactersBattleNet");

const activeCharacterRouter = require("./routes/activeCharacter");

const carnetContextRouter = require("./routes/carnetContext");
const collectorCloudRouter = require("./routes/collectorCloud");
const { loadActiveCharacter } = require("./middleware/loadActiveCharacter");

const carnetRouter = require("./routes/carnet");

// ============================================================
// APPLICATION
// ============================================================

const app = express();

const PORT = getPort();

validateProductionConfig();

app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

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

    store: new PostgresSessionStore({ pool }),

    resave: false,

    saveUninitialized: false,

    cookie: getSessionCookieOptions(),

    rolling: true,
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

app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: isProduction() ? "1d" : 0,
  }),
);

// ============================================================
// BODY PARSING
// ============================================================

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
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

// Contexte du Carnet pour le personnage actif
app.use("/api/carnet/context", carnetContextRouter);

// ============================================================
// AZER COMPAGNION
// ============================================================

app.use("/api/collector-cloud", collectorCloudRouter);
app.get("/addon", (_req, res) => {
  res.render("addon", {
    page_title: "Azer Companion Collector",
  });
});
app.use("/", loadActiveCharacter, carnetRouter);

// ============================================================
// TEST POSTGRESQL
// ============================================================

assertDatabaseReady()
  .then(() => {
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

    let shuttingDown = false;
    async function shutdown(signal) {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal}: arrêt propre du serveur...`);

      const forceExit = setTimeout(() => process.exit(1), 10000);
      forceExit.unref();

      await new Promise((resolve) => server.close(resolve));
      await pool.end();
      clearTimeout(forceExit);
    }

    process.once("SIGTERM", () => shutdown("SIGTERM").catch(console.error));
    process.once("SIGINT", () => shutdown("SIGINT").catch(console.error));
  })
  .catch(async (error) => {
    console.error("Démarrage impossible :", error.message);
    try {
      await pool.end();
    } catch {}
    process.exit(1);
  });
