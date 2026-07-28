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

app.listen(PORT, () => {
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
