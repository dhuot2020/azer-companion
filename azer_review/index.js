require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const carnetRouter = require("./routes/carnet");

const app = express();
app.use(
  session({
    name: "azer_companion_session",
    secret: process.env.SESSION_SECRET || "azer-companion-dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);
const PORT = process.env.PORT || 3030;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", carnetRouter);

const server = app.listen(PORT, (error) => {
  if (error) {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Le port ${PORT} est déjà utilisé. Arrête l’ancien serveur ou définis un autre port.`,
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

Que l'aventure continue.
  `);
});

server.on("close", () => {
  console.log("Serveur Azer Companion arrêté.");
});
