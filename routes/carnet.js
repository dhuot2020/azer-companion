const crypto = require("crypto");

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("carnet", {
    page_title: "Carnet d'aventure",
  });
});
router.get("/auth/blizzard", (req, res) => {
  const state = crypto.randomBytes(24).toString("hex");

  req.session.blizzard_oauth_state = state;

  const params = new URLSearchParams({
    client_id: process.env.BLIZZARD_CLIENT_ID,
    redirect_uri: process.env.BLIZZARD_REDIRECT_URI,
    response_type: "code",
    scope: "wow.profile",
    state: state,
  });

  const authorizationUrl = `https://oauth.battle.net/authorize?${params.toString()}`;

  res.redirect(authorizationUrl);
});

router.get("/auth/blizzard/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const returnedState = req.query.state;
    const savedState = req.session.blizzard_oauth_state;

    if (!code) {
      return res.status(400).send("Code Battle.net manquant.");
    }

    if (!returnedState || returnedState !== savedState) {
      return res.status(403).send("État OAuth invalide.");
    }

    delete req.session.blizzard_oauth_state;

    const credentials = Buffer.from(
      `${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`,
    ).toString("base64");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.BLIZZARD_REDIRECT_URI,
    });

    const tokenResponse = await fetch("https://oauth.battle.net/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();

      console.error("Erreur Battle.net :", errorText);

      return res
        .status(tokenResponse.status)
        .send("Impossible de terminer la connexion Battle.net.");
    }

    const tokenData = await tokenResponse.json();

    req.session.blizzard_access_token = tokenData.access_token;
    req.session.blizzard_token_expires_at =
      Date.now() + tokenData.expires_in * 1000;

    res.send(`
      <h1>Connexion Battle.net réussie</h1>
      <p>Azer Companion est maintenant connecté à ton compte.</p>
      <p><a href="/">Retourner à Azer Companion</a></p>
    `);
  } catch (error) {
    console.error("Erreur OAuth Blizzard :", error);

    res
      .status(500)
      .send("Une erreur est survenue pendant la connexion Battle.net.");
  }
});

router.get("/api/characters", async (req, res) => {
  if (!req.session.blizzard_access_token) {
    return res.status(401).json({
      connected: false,
    });
  }

  const response = await fetch(
    "https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US",
    {
      headers: {
        Authorization: `Bearer ${req.session.blizzard_access_token}`,
      },
    },
  );

  const profile = await response.json();

  const characters = [];

  for (const account of profile.wow_accounts) {
    for (const character of account.characters) {
      characters.push({
        id: character.id,

        name: character.name,

        level: character.level,

        realm: character.realm.slug,

        classId: character.playable_class.id,

        raceId: character.playable_race.id,

        faction: character.faction.type,

        gender: character.gender.type,
      });
    }
  }

  characters.sort((a, b) => b.level - a.level);

  res.json({
    connected: true,

    battleTag: "Tanakio",

    count: characters.length,

    characters,
  });
});

router.get("/api/blizzard/status", (req, res) => {
  const accessToken = req.session.blizzard_access_token;
  const expiresAt = req.session.blizzard_token_expires_at;

  const connected =
    Boolean(accessToken) && Boolean(expiresAt) && Date.now() < expiresAt;

  if (!connected) {
    delete req.session.blizzard_access_token;
    delete req.session.blizzard_token_expires_at;
  }

  res.json({
    connected,
  });
});

module.exports = router;
