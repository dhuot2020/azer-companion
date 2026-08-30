// ============================================================
// SESSION - doit etre AVANT les routes /api/auth
// ============================================================

const session = require("express-session");

app.set("trust proxy", 1);

app.use(
  session({
    name: process.env.SESSION_COOKIE_NAME || "azer.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);


// ============================================================
// BATTLE.NET AUTH
// ============================================================

const battleNetAuthRouter = require("./routes/authBattleNet");

app.use("/api/auth", battleNetAuthRouter);
