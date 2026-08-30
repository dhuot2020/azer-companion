// Avec les autres require:
const charactersBattleNetRouter = require("./routes/charactersBattleNet");

// APRES express-session et AVANT carnetRouter:
app.use("/api/characters", charactersBattleNetRouter);
