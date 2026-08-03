const crypto = require("crypto");

const express = require("express");
const { readCollectorSummary } = require("../services/azerCollector");
const { buildSyncResult } = require("../core/sync/syncManager");

const router = express.Router();

const BLIZZARD_REGION = String(
  process.env.BLIZZARD_REGION || "us",
).toLowerCase();
const BLIZZARD_LOCALE = process.env.BLIZZARD_LOCALE || "fr_FR";
const BLIZZARD_API_ORIGIN = `https://${BLIZZARD_REGION}.api.blizzard.com`;
const BLIZZARD_PROFILE_QUERY = `namespace=profile-${BLIZZARD_REGION}&locale=${encodeURIComponent(BLIZZARD_LOCALE)}`;
const CHARACTER_MEDIA_CONCURRENCY = 6;
const characterMediaCache = new Map();

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await callback(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}


function normalizeCharacterIdentityPart(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fr-CA");
}

function getCharacterIdentityKey(character) {
  return [
    normalizeCharacterIdentityPart(character?.realm),
    normalizeCharacterIdentityPart(character?.name),
  ].join("::");
}

function getCharacterMediaCacheKey(character) {
  return [
    String(character?.id || ""),
    getCharacterIdentityKey(character),
  ].join("::");
}

function applyCachedCharacterMedia(character) {
  const cachedMedia = characterMediaCache.get(getCharacterMediaCacheKey(character));

  if (!cachedMedia) {
    return character;
  }

  const characterKey = getCharacterIdentityKey(character);
  if (cachedMedia.mediaOwnerKey !== characterKey) {
    console.warn(
      `Média ignoré pour ${character.name}-${character.realm}: propriétaire invalide.`,
    );
    return character;
  }

  return {
    ...character,
    ...cachedMedia,
    mediaOwnerKey: characterKey,
    mediaStatus: cachedMedia.mediaStatus || "cached",
  };
}

function cacheCharacterMedia(character) {
  if (!character?.avatarUrl && !character?.portraitUrl && !character?.fullBodyUrl) {
    return character;
  }

  const mediaOwnerKey = getCharacterIdentityKey(character);
  characterMediaCache.set(getCharacterMediaCacheKey(character), {
    avatarUrl: character.avatarUrl || null,
    portraitUrl: character.portraitUrl || null,
    fullBodyUrl: character.fullBodyUrl || null,
    media: character.media || null,
    mediaOwnerKey,
    mediaStatus: character.mediaStatus || "available",
  });

  return character;
}

async function fetchJsonWithRetry(url, accessToken, attempts = 2) {
  let response = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok || ![404, 429, 500, 502, 503, 504].includes(response.status)) {
      break;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  return response;
}

function normalizeBlizzardHref(href) {
  if (!href) {
    return null;
  }

  try {
    const url = new URL(href);
    url.searchParams.set("namespace", `profile-${BLIZZARD_REGION}`);
    url.searchParams.set("locale", BLIZZARD_LOCALE);
    return url.toString();
  } catch {
    return href;
  }
}

async function fetchCharacterAvatar(character, accessToken) {
  const realmSlug = encodeURIComponent(
    String(character.realm || "")
      .trim()
      .toLowerCase(),
  );
  const characterName = encodeURIComponent(
    String(character.name || "")
      .trim()
      .toLowerCase(),
  );
  const profileUrl =
    `${BLIZZARD_API_ORIGIN}/profile/wow/character/` +
    `${realmSlug}/${characterName}?${BLIZZARD_PROFILE_QUERY}`;
  const constructedMediaUrl =
    `${BLIZZARD_API_ORIGIN}/profile/wow/character/` +
    `${realmSlug}/${characterName}/character-media?${BLIZZARD_PROFILE_QUERY}`;

  try {
    const candidateUrls = [];
    let profileStatus = null;

    // Le résumé du personnage contient le lien média canonique. Pour les
    // nouveaux personnages, ce lien est plus fiable qu'une URL reconstruite.
    const profileResponse = await fetchJsonWithRetry(profileUrl, accessToken, 2);
    profileStatus = profileResponse.status;

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      const canonicalMediaUrl = normalizeBlizzardHref(
        profile?.media?.href || profile?.media_url || null,
      );

      if (canonicalMediaUrl) {
        candidateUrls.push(canonicalMediaUrl);
      }
    }

    if (!candidateUrls.includes(constructedMediaUrl)) {
      candidateUrls.push(constructedMediaUrl);
    }

    let lastStatus = null;

    for (const mediaUrl of candidateUrls) {
      const response = await fetchJsonWithRetry(mediaUrl, accessToken, 2);
      lastStatus = response.status;

      if (!response.ok) {
        continue;
      }

      const media = await response.json();
      const getAsset = (key) =>
        media.assets?.find(
          (asset) => String(asset?.key || "").toLowerCase() === key,
        )?.value;
      const avatarUrl = getAsset("avatar") || media.avatar_url || null;
      const insetUrl = getAsset("inset") || media.bust_url || null;
      const fullBodyUrl =
        getAsset("main") || getAsset("main-raw") || media.render_url || null;
      const portraitUrl = avatarUrl || insetUrl || null;

      if (avatarUrl || portraitUrl || fullBodyUrl) {
        return cacheCharacterMedia({
          ...character,
          avatarUrl,
          portraitUrl,
          fullBodyUrl,
          media,
          mediaOwnerKey: getCharacterIdentityKey(character),
          mediaStatus: "available",
          mediaDiagnostic: {
            profileStatus,
            mediaStatus: response.status,
            source: mediaUrl === constructedMediaUrl ? "constructed" : "canonical",
          },
        });
      }
    }

    const cachedCharacter = applyCachedCharacterMedia(character);
    if (cachedCharacter !== character) {
      return cachedCharacter;
    }

    console.warn(
      `Aucun portrait Blizzard pour ${character.name}-${character.realm}. ` +
        `Profil=${profileStatus}, média=${lastStatus}.`,
    );

    return {
      ...character,
      avatarUrl: null,
      portraitUrl: null,
      fullBodyUrl: null,
      media: null,
      mediaOwnerKey: null,
      mediaStatus: lastStatus === 404 ? "pending" : "error",
      mediaDiagnostic: {
        profileStatus,
        mediaStatus: lastStatus,
        source: "none",
        reason: "Blizzard ne fournit actuellement aucun média pour ce personnage.",
      },
    };
  } catch (error) {
    console.warn(
      `Impossible de récupérer le média Blizzard de ${character.name} :`,
      error,
    );
    return {
      ...applyCachedCharacterMedia(character),
      mediaDiagnostic: {
        source: "exception",
        message: error.message,
      },
    };
  }
}

function normalizeCharacterProfessions(data) {
  const normalizeGroup = (professions, type) =>
    (professions || []).map((entry) => ({
      id: entry.profession?.id || null,
      name: entry.profession?.name || "Métier",
      type,
      tiers: (entry.tiers || []).map((tier) => ({
        id: tier.tier?.id || null,
        name: tier.tier?.name || "Compétence",
        skillPoints: Number(tier.skill_points || 0),
        maxSkillPoints: Number(tier.max_skill_points || 0),
      })),
    }));

  return [
    ...normalizeGroup(data.primaries, "primary"),
    ...normalizeGroup(data.secondaries, "secondary"),
  ];
}

async function fetchCharacterProfessions(realm, name, accessToken) {
  const realmSlug = encodeURIComponent(
    String(realm || "")
      .trim()
      .toLowerCase(),
  );
  const characterName = encodeURIComponent(
    String(name || "")
      .trim()
      .toLowerCase(),
  );
  const professionsUrl =
    `${BLIZZARD_API_ORIGIN}/profile/wow/character/` +
    `${realmSlug}/${characterName}/professions?${BLIZZARD_PROFILE_QUERY}`;

  const response = await fetch(professionsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = new Error(
      `Métiers Blizzard indisponibles pour ${name} sur ${realm} (${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }

  return normalizeCharacterProfessions(await response.json());
}

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

    // Retour direct au carnet
    return res.redirect("/");
  } catch (error) {
    console.error("Erreur OAuth Blizzard :", error);

    return res
      .status(500)
      .send("Une erreur est survenue pendant la connexion Battle.net.");
  }
});

async function synchronizeAccount(req) {
  const startedAt = Date.now();
  const accessToken = req.session.blizzard_access_token;
  const response = await fetch(
    `${BLIZZARD_API_ORIGIN}/profile/user/wow?${BLIZZARD_PROFILE_QUERY}`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-cache",
      },
    },
  );

  if (!response.ok) {
    const error = new Error("Impossible de récupérer le profil Battle.net.");
    error.status = response.status;
    throw error;
  }

  const profile = await response.json();
  const characters = [];

  for (const account of profile.wow_accounts || []) {
    for (const character of account.characters || []) {
      characters.push({
        id: character.id,
        name: character.name,
        level: character.level,
        realm: character.realm.slug,
        classId: character.playable_class.id,
        raceId: character.playable_race.id,
        faction: character.faction.type,
        gender: character.gender.type,
        characterKey: getCharacterIdentityKey({
          name: character.name,
          realm: character.realm.slug,
        }),
      });
    }
  }

  characters.sort((first, second) => second.level - first.level);

  const charactersWithAvatars = await mapWithConcurrency(
    characters,
    CHARACTER_MEDIA_CONCURRENCY,
    (character) => fetchCharacterAvatar(character, accessToken),
  );

  let collector = {
    available: false,
    characters: [],
    achievements: [],
  };

  try {
    collector = await readCollectorSummary();
  } catch (collectorError) {
    console.warn("Résumé Collector indisponible :", collectorError.message);
  }

  return buildSyncResult({
    characters: charactersWithAvatars,
    collector,
    startedAt,
  });
}

async function handleAccountSync(req, res) {
  if (!req.session.blizzard_access_token) {
    return res.status(401).json({
      connected: false,
      error: "Compte Battle.net non connecté.",
    });
  }

  try {
    return res.json(await synchronizeAccount(req));
  } catch (error) {
    console.error("Erreur de synchronisation Azer Companion :", error);
    return res.status(error.status || 502).json({
      connected: false,
      error: error.message || "La synchronisation est temporairement indisponible.",
    });
  }
}

router.get("/api/characters", handleAccountSync);
router.post("/api/sync", handleAccountSync);

router.get("/api/characters/:realm/:name/professions", async (req, res) => {
  if (!req.session.blizzard_access_token) {
    return res.status(401).json({
      connected: false,
    });
  }

  try {
    const professions = await fetchCharacterProfessions(
      req.params.realm,
      req.params.name,
      req.session.blizzard_access_token,
    );

    res.json({
      connected: true,
      professions,
    });
  } catch (error) {
    if (error.status !== 404) {
      console.warn(error.message);
    }

    res.status(error.status || 502).json({
      connected: true,
      professions: [],
      error: "Impossible de récupérer les métiers de ce personnage.",
    });
  }
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

router.get("/auth/blizzard/logout", (req, res) => {
  delete req.session.blizzard_access_token;
  delete req.session.blizzard_token_expires_at;

  res.redirect("/");
});

router.get("/api/quests", async (req, res) => {
  try {
    const collector = await readCollectorSummary();
    if (!collector.available) {
      return res.json({ available: false, characters: [], completedObserved: [] });
    }

    const characters = (collector.characters || []).map((character) => ({
      storageKey: character.storageKey,
      identityKey: character.identityKey,
      guid: character.guid,
      name: character.name,
      realm: character.realm,
      active: character.quests?.active || [],
      completedObserved: character.quests?.completedObserved || [],
      completedHistory: character.quests?.completedHistory || [],
      completedHistoryCount: character.quests?.completedHistoryCount || 0,
      completedAccountShared: character.quests?.completedAccountShared || [],
      completedAccountSharedCount: character.quests?.completedAccountSharedCount || 0,
      completedHistoryScannedAt: character.quests?.completedHistoryScannedAt || 0,
    }));

    return res.json({
      available: true,
      sourceUpdatedAt: collector.sourceUpdatedAt || 0,
      completedObserved: collector.questSummary?.completedObserved || [],
      characters,
    });
  } catch (error) {
    console.error("Impossible de lire les quêtes du Collector :", error);
    return res.status(500).json({
      available: false,
      error: "Impossible de lire les quêtes du Collector.",
      characters: [],
      completedObserved: [],
    });
  }
});

router.get("/api/collector", async (req, res) => {
  try {
    res.json(await readCollectorSummary());
  } catch (error) {
    console.error("Impossible de lire Azer Companion Collector :", error);
    res.status(500).json({
      available: false,
      characters: [],
      error: "Les données locales du collecteur sont illisibles.",
    });
  }
});

module.exports = router;
