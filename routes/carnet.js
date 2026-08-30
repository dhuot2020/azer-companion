const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const express = require("express");
const { readCollectorSummary } = require("../services/azerCollector");
const { buildSyncResult } = require("../core/sync/syncManager");
const mediaRetry = require("../services/blizzardMediaRetry");
const { getStatus: getAseStatus } = require("../core/ase");
const { getActiveAccessTokenForUser } = require("../repositories/oauthCredentials");

const router = express.Router();

async function getRequestBattleNetAccessToken(req) {
  // Compatibilite ancien flux, puis nouveau coffre OAuth chiffre PostgreSQL.
  if (req.session?.blizzard_access_token) {
    return req.session.blizzard_access_token;
  }

  const userId = req.session?.userId;
  if (!userId) return null;

  const credential = await getActiveAccessTokenForUser(userId);
  if (!credential || credential.expired || !credential.accessToken) return null;
  return credential.accessToken;
}


const BLIZZARD_REGION = String(
  process.env.BLIZZARD_REGION || "us",
).toLowerCase();
const REQUESTED_BLIZZARD_LOCALE = process.env.BLIZZARD_LOCALE || "fr_FR";
const BLIZZARD_LOCALE =
  REQUESTED_BLIZZARD_LOCALE.toLowerCase() === "fr_ca"
    ? "fr_FR"
    : REQUESTED_BLIZZARD_LOCALE;
const BLIZZARD_API_ORIGIN = `https://${BLIZZARD_REGION}.api.blizzard.com`;
const BLIZZARD_PROFILE_QUERY = `namespace=profile-${BLIZZARD_REGION}&locale=${encodeURIComponent(BLIZZARD_LOCALE)}`;
const CHARACTER_MEDIA_CONCURRENCY = 6;
const QUEST_REWARD_MEDIA_CONCURRENCY = 5;
const QUEST_REWARD_MEDIA_TTL_MS = 24 * 60 * 60 * 1000;
const characterMediaCache = new Map();
const CHARACTER_MEDIA_CACHE_FILE = path.join(
  process.cwd(),
  "data",
  "cache",
  "character-media.json",
);

function loadPersistentCharacterMediaCache() {
  try {
    if (!fs.existsSync(CHARACTER_MEDIA_CACHE_FILE)) return;
    const payload = JSON.parse(
      fs.readFileSync(CHARACTER_MEDIA_CACHE_FILE, "utf8"),
    );
    for (const [key, value] of Object.entries(payload?.characters || {})) {
      if (value && typeof value === "object")
        characterMediaCache.set(key, value);
    }
    console.info(
      `Portrait Engine : ${characterMediaCache.size} portrait(s) restauré(s) du cache.`,
    );
  } catch (error) {
    console.warn(
      "Portrait Engine : cache persistant illisible.",
      error.message,
    );
  }
}

function savePersistentCharacterMediaCache() {
  try {
    fs.mkdirSync(path.dirname(CHARACTER_MEDIA_CACHE_FILE), { recursive: true });
    const characters = Object.fromEntries(characterMediaCache.entries());
    fs.writeFileSync(
      CHARACTER_MEDIA_CACHE_FILE,
      JSON.stringify(
        { version: 1, updatedAt: new Date().toISOString(), characters },
        null,
        2,
      ),
      "utf8",
    );
  } catch (error) {
    console.warn(
      "Portrait Engine : impossible de sauvegarder le cache.",
      error.message,
    );
  }
}

loadPersistentCharacterMediaCache();
const questRewardMediaCache = new Map();
const collectionMediaCache = new Map();
const collectionDetailCache = new Map();

function getCachedQuestRewardMedia(kind, id) {
  const key = `${kind}:${id}`;
  const cached = questRewardMediaCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > QUEST_REWARD_MEDIA_TTL_MS) {
    questRewardMediaCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedQuestRewardMedia(kind, id, value) {
  questRewardMediaCache.set(`${kind}:${id}`, { cachedAt: Date.now(), value });
  return value;
}

async function fetchQuestRewardMedia(kind, id, accessToken) {
  const numericId = Number(id);
  if (!numericId || !accessToken) return null;

  const cached = getCachedQuestRewardMedia(kind, numericId);
  if (cached !== null) return cached;

  const path =
    kind === "currency"
      ? `/data/wow/media/currency/${numericId}`
      : `/data/wow/media/item/${numericId}`;
  const url = `${BLIZZARD_API_ORIGIN}${path}?namespace=static-${BLIZZARD_REGION}&locale=${encodeURIComponent(BLIZZARD_LOCALE)}`;

  try {
    const response = await fetchJsonWithRetry(url, accessToken, 2);
    if (!response.ok) return setCachedQuestRewardMedia(kind, numericId, null);
    const payload = await response.json();
    const iconUrl =
      payload.assets?.find((asset) =>
        ["icon", "icon-raw"].includes(String(asset?.key || "").toLowerCase()),
      )?.value || null;
    return setCachedQuestRewardMedia(kind, numericId, iconUrl);
  } catch (error) {
    console.warn(
      `Icône de récompense indisponible (${kind} ${numericId}) :`,
      error.message,
    );
    return null;
  }
}

async function enrichQuestRewardMedia(quests, accessToken) {
  if (!accessToken) return quests;

  const jobs = new Map();
  for (const quest of quests) {
    const rewards = quest?.rewards;
    if (!rewards || typeof rewards !== "object") continue;
    for (const item of [...(rewards.items || []), ...(rewards.choices || [])]) {
      const id = Number(item?.itemID || 0);
      if (id) jobs.set(`item:${id}`, { kind: "item", id });
    }
    for (const currency of rewards.currencies || []) {
      const id = Number(currency?.currencyID || 0);
      if (id) jobs.set(`currency:${id}`, { kind: "currency", id });
    }
  }

  const media = new Map();
  await mapWithConcurrency(
    [...jobs.values()],
    QUEST_REWARD_MEDIA_CONCURRENCY,
    async (job) => {
      media.set(
        `${job.kind}:${job.id}`,
        await fetchQuestRewardMedia(job.kind, job.id, accessToken),
      );
    },
  );

  return quests.map((quest) => {
    const rewards = quest?.rewards;
    if (!rewards || typeof rewards !== "object") return quest;
    const enrichItem = (item, kind, idField) => {
      const id = Number(item?.[idField] || 0);
      const iconUrl = id ? media.get(`${kind}:${id}`) : null;
      return { ...item, iconUrl: iconUrl || item.iconUrl || null };
    };
    return {
      ...quest,
      rewards: {
        ...rewards,
        items: (rewards.items || []).map((item) =>
          enrichItem(item, "item", "itemID"),
        ),
        choices: (rewards.choices || []).map((item) =>
          enrichItem(item, "item", "itemID"),
        ),
        currencies: (rewards.currencies || []).map((item) =>
          enrichItem(item, "currency", "currencyID"),
        ),
      },
    };
  });
}

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
  return [String(character?.id || ""), getCharacterIdentityKey(character)].join(
    "::",
  );
}

function getAzerFallbackPortrait(character) {
  const classId = Math.min(13, Math.max(1, Number(character?.classId) || 1));
  const faction = String(character?.faction || "ALLIANCE").toUpperCase();
  const factionOffset = faction === "HORDE" ? 13 : 0;
  const portraitIndex = classId + factionOffset;
  return `/assets/characters/showcase/avatars/showcase-${String(portraitIndex).padStart(2, "0")}.webp`;
}

function applyAzerFallbackPortrait(
  character,
  diagnostic,
  mediaStatus = "fallback",
) {
  const fallbackUrl = getAzerFallbackPortrait(character);
  return {
    ...character,
    avatarUrl: fallbackUrl,
    portraitUrl: fallbackUrl,
    fullBodyUrl: character.fullBodyUrl || null,
    media: character.media || null,
    mediaOwnerKey: getCharacterIdentityKey(character),
    mediaStatus,
    portraitSource: "azer-fallback",
    isFallbackPortrait: true,
    mediaDiagnostic: {
      ...diagnostic,
      source: "azer-fallback",
      resolved: true,
      fallbackUrl,
    },
  };
}

function applyCachedCharacterMedia(character) {
  const cachedMedia = characterMediaCache.get(
    getCharacterMediaCacheKey(character),
  );

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
  if (
    !character?.avatarUrl &&
    !character?.portraitUrl &&
    !character?.fullBodyUrl
  ) {
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
    cachedAt: Date.now(),
  });
  savePersistentCharacterMediaCache();

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

    if (
      response.ok ||
      ![404, 429, 500, 502, 503, 504].includes(response.status)
    ) {
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
  const rawRealmSlug = String(
    character.realmSlug || character.realm || "",
  ).trim();
  const realmSlug = encodeURIComponent(rawRealmSlug.toLowerCase());
  const characterName = encodeURIComponent(
    String(character.name || "")
      .trim()
      .toLowerCase(),
  );
  const standardProfileUrl =
    `${BLIZZARD_API_ORIGIN}/profile/wow/character/` +
    `${realmSlug}/${characterName}?${BLIZZARD_PROFILE_QUERY}`;
  const standardMediaUrl =
    `${BLIZZARD_API_ORIGIN}/profile/wow/character/` +
    `${realmSlug}/${characterName}/character-media?${BLIZZARD_PROFILE_QUERY}`;

  const profileUrls = [];
  const canonicalProfileUrl = normalizeBlizzardHref(
    character.profileHref || null,
  );
  if (canonicalProfileUrl) profileUrls.push(canonicalProfileUrl);
  if (!profileUrls.includes(standardProfileUrl))
    profileUrls.push(standardProfileUrl);

  const diagnostic = {
    character: `${character.name}-${rawRealmSlug}`,
    region: BLIZZARD_REGION,
    profileAttempts: [],
    mediaAttempts: [],
    source: "none",
  };

  const queuedRetry = mediaRetry.getEntry(character);
  if (
    queuedRetry &&
    queuedRetry.status === "waiting" &&
    !mediaRetry.isDue(character)
  ) {
    return applyAzerFallbackPortrait(
      character,
      {
        ...diagnostic,
        source: "retry-queue",
        resolved: true,
        upstreamStatus: "waiting",
        retry: queuedRetry,
        reason: "Nouvelle vérification Blizzard planifiée.",
      },
      "waiting",
    );
  }

  try {
    const candidateMediaUrls = [];

    for (const profileUrl of profileUrls) {
      const profileResponse = await fetchJsonWithRetry(
        profileUrl,
        accessToken,
        2,
      );
      diagnostic.profileAttempts.push({
        url: profileUrl,
        status: profileResponse.status,
      });

      if (!profileResponse.ok) continue;
      const profile = await profileResponse.json();
      const canonicalMediaUrl = normalizeBlizzardHref(
        profile?.media?.href || profile?.media_url || null,
      );
      if (
        canonicalMediaUrl &&
        !candidateMediaUrls.includes(canonicalMediaUrl)
      ) {
        candidateMediaUrls.push(canonicalMediaUrl);
      }
    }

    const accountMediaUrl = normalizeBlizzardHref(character.mediaHref || null);
    if (accountMediaUrl && !candidateMediaUrls.includes(accountMediaUrl)) {
      candidateMediaUrls.unshift(accountMediaUrl);
    }
    if (!candidateMediaUrls.includes(standardMediaUrl)) {
      candidateMediaUrls.push(standardMediaUrl);
    }

    for (const mediaUrl of candidateMediaUrls) {
      const response = await fetchJsonWithRetry(mediaUrl, accessToken, 2);
      diagnostic.mediaAttempts.push({ url: mediaUrl, status: response.status });
      if (!response.ok) continue;

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
        diagnostic.source =
          mediaUrl === standardMediaUrl ? "constructed" : "canonical";
        diagnostic.resolved = true;
        mediaRetry.resolve(character, {
          profileStatus: diagnostic.profileAttempts.at(-1)?.status || 200,
          mediaStatus: response.status,
        });
        return cacheCharacterMedia({
          ...character,
          avatarUrl,
          portraitUrl,
          fullBodyUrl,
          media,
          mediaOwnerKey: getCharacterIdentityKey(character),
          mediaStatus: "available",
          portraitSource: "blizzard",
          isFallbackPortrait: false,
          mediaDiagnostic: diagnostic,
        });
      }
    }

    const cachedCharacter = applyCachedCharacterMedia(character);
    if (cachedCharacter !== character) {
      return {
        ...cachedCharacter,
        mediaStatus: "cached",
        portraitSource: "persistent-cache",
        isFallbackPortrait: false,
        mediaDiagnostic: {
          ...diagnostic,
          source: "persistent-cache",
          resolved: true,
        },
      };
    }

    const statuses = [
      ...diagnostic.profileAttempts.map((attempt) => attempt.status),
      ...diagnostic.mediaAttempts.map((attempt) => attempt.status),
    ];
    const allMissing =
      statuses.length > 0 && statuses.every((status) => status === 404);
    console.warn(
      `Portrait Engine : aucun média Blizzard pour ${character.name}-${rawRealmSlug}. ` +
        `Région=${BLIZZARD_REGION}, statuts=${statuses.join(",") || "aucun"}.`,
    );

    const retryEntry = mediaRetry.schedule(character, {
      profileStatus: diagnostic.profileAttempts.at(-1)?.status || null,
      mediaStatus: diagnostic.mediaAttempts.at(-1)?.status || null,
      reason: allMissing
        ? "Profil ou média Blizzard encore non publié."
        : "Erreur temporaire pendant la récupération du média.",
    });

    return applyAzerFallbackPortrait(
      character,
      {
        ...diagnostic,
        retry: retryEntry,
        upstreamStatus: allMissing ? "pending" : "error",
        reason: allMissing
          ? "Blizzard ne publie pas encore le média individuel de ce personnage."
          : "La récupération du média Blizzard a échoué; un portrait Azer est utilisé.",
      },
      "fallback",
    );
  } catch (error) {
    const cachedCharacter = applyCachedCharacterMedia(character);
    console.warn(
      `Portrait Engine : erreur pour ${character.name}-${rawRealmSlug} :`,
      error.message,
    );
    if (cachedCharacter !== character) {
      return {
        ...cachedCharacter,
        mediaStatus: "cached",
        portraitSource: "persistent-cache",
        isFallbackPortrait: false,
        mediaDiagnostic: {
          ...diagnostic,
          source: "persistent-cache",
          resolved: true,
          message: error.message,
        },
      };
    }

    return applyAzerFallbackPortrait(
      character,
      {
        ...diagnostic,
        upstreamStatus: "error",
        reason: "Erreur réseau ou API; un portrait Azer est utilisé.",
        message: error.message,
      },
      "fallback",
    );
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
    const errorText = await response.text();

    console.error(
      "Erreur profil Battle.net:",
      response.status,
      response.statusText,
      errorText,
    );

    const error = new Error(
      `Impossible de récupérer le profil Battle.net. HTTP ${response.status}`,
    );

    error.status = response.status;
    throw error;
  }
  return normalizeCharacterProfessions(await response.json());
}

async function fetchProfileResource(
  pathname,
  accessToken,
  label,
  query = BLIZZARD_PROFILE_QUERY,
) {
  const separator = pathname.includes("?") ? "&" : "?";
  const response = await fetch(
    `${BLIZZARD_API_ORIGIN}${pathname}${separator}${query}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    const error = new Error(`${label} indisponible (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function normalizeCharacterAchievements(data = {}) {
  const completed = (data.achievements || [])
    .map((entry) => ({
      id: Number(entry.achievement?.id || entry.id || 0),
      name: String(entry.achievement?.name || entry.name || "Haut fait obtenu"),
      completedAt: Number(entry.completed_timestamp || entry.completedAt || 0),
    }))
    .filter((entry) => entry.id && entry.completedAt > 0)
    .sort((first, second) => second.completedAt - first.completedAt);

  return {
    totalQuantity: Number(data.total_quantity || completed.length),
    totalPoints: Number(data.total_points || 0),
    recent: completed.slice(0, 3),
  };
}

async function fetchCharacterAchievements(realm, name, accessToken) {
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
  const data = await fetchProfileResource(
    `/profile/wow/character/${realmSlug}/${characterName}/achievements`,
    accessToken,
    `Hauts faits Blizzard pour ${name} sur ${realm}`,
  );
  return normalizeCharacterAchievements(data);
}

async function fetchAccountCollections(accessToken) {
  const [mountsResult, petsResult] = await Promise.allSettled([
    fetchProfileResource(
      "/profile/user/wow/collections/mounts",
      accessToken,
      "Collection de montures Blizzard",
    ),
    fetchProfileResource(
      "/profile/user/wow/collections/pets",
      accessToken,
      "Collection de mascottes Blizzard",
    ),
  ]);

  const mounts =
    mountsResult.status === "fulfilled" ? mountsResult.value.mounts || [] : [];
  const pets =
    petsResult.status === "fulfilled" ? petsResult.value.pets || [] : [];
  const uniqueSpecies = new Set(
    pets
      .map((pet) => Number(pet.species?.id || pet.species_id || 0))
      .filter(Boolean),
  );

  return {
    mounts: {
      count: mounts.length,
      favorites: mounts.filter((mount) => mount.is_favorite === true).length,
      available: mountsResult.status === "fulfilled",
      items: mounts
        .map((entry) => ({
          id: Number(entry.mount?.id || entry.id || 0),
          name: String(entry.mount?.name || entry.name || "Monture"),
          favorite: entry.is_favorite === true,
        }))
        .filter((entry) => entry.id)
        .sort(
          (first, second) =>
            Number(second.favorite) - Number(first.favorite) ||
            first.name.localeCompare(second.name, "fr"),
        ),
    },
    pets: {
      count: pets.length,
      uniqueSpecies: uniqueSpecies.size,
      maxLevel: pets.filter((pet) => Number(pet.level || 0) >= 25).length,
      available: petsResult.status === "fulfilled",
      items: pets
        .map((entry) => ({
          id: Number(entry.species?.id || entry.species_id || 0),
          name: String(entry.custom_name || entry.species?.name || "Mascotte"),
          speciesName: String(entry.species?.name || "Mascotte"),
          level: Number(entry.level || 0),
          quality: String(entry.quality?.name || entry.quality?.type || ""),
          favorite: entry.is_favorite === true,
          displayId: Number(entry.creature_display?.id || 0),
          health: Number(entry.stats?.health || 0),
          power: Number(entry.stats?.power || 0),
          speed: Number(entry.stats?.speed || 0),
        }))
        .filter((entry) => entry.id)
        .sort(
          (first, second) =>
            Number(second.favorite) - Number(first.favorite) ||
            second.level - first.level ||
            first.name.localeCompare(second.name, "fr"),
        ),
    },
  };
}

async function fetchCollectionDetail(kind, id, accessToken) {
  const cacheKey = `${kind}:${id}`;
  if (collectionDetailCache.has(cacheKey))
    return collectionDetailCache.get(cacheKey);
  const detailPath =
    kind === "mount" ? `/data/wow/mount/${id}` : `/data/wow/pet/${id}`;
  const detail = await fetchProfileResource(
    detailPath,
    accessToken,
    `Détails de ${kind === "mount" ? "monture" : "mascotte"}`,
    `namespace=static-${BLIZZARD_REGION}&locale=${encodeURIComponent(BLIZZARD_LOCALE)}`,
  );
  collectionDetailCache.set(cacheKey, detail);
  return detail;
}

async function fetchCollectionMedia(kind, id, displayId, accessToken) {
  const cacheKey = `${kind}:${id}:${displayId || 0}`;
  if (collectionMediaCache.has(cacheKey))
    return collectionMediaCache.get(cacheKey);

  let creatureDisplayId = Number(displayId || 0);
  if (!creatureDisplayId) {
    const detail = await fetchCollectionDetail(kind, id, accessToken);
    creatureDisplayId = Number(
      detail.creature_displays?.[0]?.id || detail.creature_display?.id || 0,
    );
  }

  if (!creatureDisplayId) return null;
  const response = await fetch(
    `${BLIZZARD_API_ORIGIN}/data/wow/media/creature-display/${creatureDisplayId}` +
      `?namespace=static-${BLIZZARD_REGION}&locale=${encodeURIComponent(BLIZZARD_LOCALE)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) return null;
  const media = await response.json();
  const preferredKeys = ["zoom-raw", "zoom", "avatar", "icon"];
  const asset =
    preferredKeys
      .map(
        (key) =>
          (media.assets || []).find(
            (entry) => String(entry.key || "").toLowerCase() === key,
          )?.value,
      )
      .find(Boolean) || null;
  if (asset) collectionMediaCache.set(cacheKey, asset);
  return asset;
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
        realmSlug: character.realm.slug,
        profileHref: character.href || null,
        mediaHref: character.media?.href || null,
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
      error:
        error.message || "La synchronisation est temporairement indisponible.",
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

router.get("/api/characters/:realm/:name/progression", async (req, res) => {
  const accessToken = await getRequestBattleNetAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({ connected: false });
  }
  const [professionsResult, achievementsResult, collectionsResult] =
    await Promise.allSettled([
      fetchCharacterProfessions(req.params.realm, req.params.name, accessToken),
      fetchCharacterAchievements(
        req.params.realm,
        req.params.name,
        accessToken,
      ),
      fetchAccountCollections(accessToken),
    ]);

  return res.json({
    connected: true,
    professions:
      professionsResult.status === "fulfilled" ? professionsResult.value : [],
    achievements:
      achievementsResult.status === "fulfilled"
        ? achievementsResult.value
        : null,
    collections:
      collectionsResult.status === "fulfilled" ? collectionsResult.value : null,
    available: {
      professions: professionsResult.status === "fulfilled",
      achievements: achievementsResult.status === "fulfilled",
      collections: collectionsResult.status === "fulfilled",
    },
  });
});

router.get("/api/portraits/diagnostics", async (req, res) => {
  if (!req.session.blizzard_access_token) {
    return res
      .status(401)
      .json({ connected: false, error: "Compte Battle.net non connecté." });
  }

  try {
    const syncResult = await synchronizeAccount(req);
    const portraits = (syncResult.characters || []).map((character) => ({
      id: character.id,
      name: character.name,
      realm: character.realm,
      level: character.level,
      mediaStatus: character.mediaStatus || "unknown",
      hasAvatar: Boolean(character.avatarUrl),
      hasPortrait: Boolean(character.portraitUrl),
      hasFullBody: Boolean(character.fullBodyUrl),
      portraitSource: character.portraitSource || "unknown",
      isFallbackPortrait: Boolean(character.isFallbackPortrait),
      diagnostic: character.mediaDiagnostic || null,
    }));
    return res.json({ connected: true, region: BLIZZARD_REGION, portraits });
  } catch (error) {
    return res
      .status(error.status || 502)
      .json({ connected: true, error: error.message });
  }
});

router.get("/api/blizzard-sync/queue", (req, res) => {
  const entries = mediaRetry.list();
  res.json({
    available: true,
    count: entries.filter((entry) => entry.status === "waiting").length,
    entries,
  });
});

router.post("/api/blizzard-sync/retry/:realm/:name", (req, res) => {
  const character = { realm: req.params.realm, name: req.params.name };
  mediaRetry.reset(character);
  res.json({
    accepted: true,
    character: `${req.params.name}-${req.params.realm}`,
    message: "La prochaine synchronisation vérifiera immédiatement Blizzard.",
  });
});

router.get("/api/ase/status", (req, res) => {
  res.json({
    ok: true,
    ...getAseStatus(),
  });
});

router.get("/api/ase/events", (req, res) => {
  const eventEngine = require("../core/engine/event/register");
  const types = String(req.query.types || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const events = eventEngine.listEvents({
    limit: req.query.limit,
    characterKey: req.query.characterKey,
    types,
  });
  res.json({
    ok: true,
    count: events.length,
    events,
  });
});

router.get("/api/ase/item-icon/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId || 0);
  const accessToken = req.session.blizzard_access_token;

  if (!itemId || !accessToken) {
    return res.status(404).end();
  }

  const iconUrl = await fetchQuestRewardMedia("item", itemId, accessToken);
  if (!iconUrl) {
    return res.status(404).end();
  }

  res.set("Cache-Control", "private, max-age=86400");
  return res.redirect(302, iconUrl);
});

router.get("/api/ase/collection-detail/:kind/:id", async (req, res) => {
  const kind = req.params.kind === "pet" ? "pet" : "mount";
  const id = Number(req.params.id || 0);
  const accessToken = await getRequestBattleNetAccessToken(req);
  if (!id || !accessToken) return res.status(404).json({ available: false });

  try {
    const detail = await fetchCollectionDetail(kind, id, accessToken);
    return res.json({
      available: true,
      id,
      name: String(detail.name || ""),
      description: String(detail.description || ""),
      source: String(
        detail.source?.name || detail.source || detail.source_type?.name || "",
      ),
      type: String(
        kind === "pet"
          ? detail.battle_pet_type?.name || "Mascotte de combat"
          : detail.source_type?.name || "Monture",
      ),
      capturable: detail.is_capturable === true,
      tradable: detail.is_tradable === true,
    });
  } catch (error) {
    return res.status(error.status || 404).json({ available: false });
  }
});

router.get("/api/ase/collection-media/:kind/:id", async (req, res) => {
  const kind = req.params.kind === "pet" ? "pet" : "mount";
  const id = Number(req.params.id || 0);
  const displayId = Number(req.query.displayId || 0);
  const accessToken = await getRequestBattleNetAccessToken(req);
  if (!id || !accessToken) return res.status(404).end();

  try {
    const mediaUrl = await fetchCollectionMedia(
      kind,
      id,
      displayId,
      accessToken,
    );
    if (!mediaUrl) return res.status(404).end();
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) return res.status(404).end();
    const contentType =
      mediaResponse.headers.get("content-type") || "image/png";
    const imageBuffer = Buffer.from(await mediaResponse.arrayBuffer());
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "private, max-age=604800");
    return res.send(imageBuffer);
  } catch (_error) {
    return res.status(404).end();
  }
});

router.get("/api/ase/heroes", async (req, res) => {
  try {
    const syncResult = await synchronizeAccount(req);
    const heroes = Array.isArray(syncResult.heroes) ? syncResult.heroes : [];
    const requestedKey = String(req.query.characterKey || "")
      .trim()
      .toLowerCase();
    const filtered = requestedKey
      ? heroes.filter(
          (hero) => String(hero.key || "").toLowerCase() === requestedKey,
        )
      : heroes;
    res.json({
      ok: true,
      count: filtered.length,
      heroes: filtered,
      summary: syncResult.ase?.hero || null,
    });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

router.get("/api/ase/debug", (req, res) => {
  const eventEngine = require("../core/engine/event/register");
  res.json({
    ok: true,
    ...eventEngine.getDebug({
      characterKey: req.query.characterKey,
    }),
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

router.get("/auth/blizzard/logout", (req, res) => {
  delete req.session.blizzard_access_token;
  delete req.session.blizzard_token_expires_at;

  res.redirect("/");
});

router.get("/api/quests", async (req, res) => {
  try {
    const collector = await readCollectorSummary();
    if (!collector.available) {
      return res.json({
        available: false,
        account: null,
        characters: [],
        completedObserved: [],
      });
    }

    const normalizeQuestList = (value) => (Array.isArray(value) ? value : []);
    const questId = (quest) => Number(quest?.id || 0);
    const questKey = (character) =>
      String(
        character.identityKey ||
          `${character.name || ""}-${character.realm || ""}`,
      )
        .normalize("NFKC")
        .toLowerCase();

    const rawCharacters = (collector.characters || []).map((character) => ({
      storageKey: character.storageKey,
      identityKey: character.identityKey,
      guid: character.guid,
      name: character.name,
      realm: character.realm,
      level: character.level || 0,
      className: character.className || character.appearance?.className || "",
      classId: character.classId || character.appearance?.classID || 0,
      classSlug: character.appearance?.classSlug || "",
      raceName: character.raceName || character.appearance?.raceName || "",
      raceId: character.raceId || character.appearance?.raceID || 0,
      raceSlug: character.appearance?.raceSlug || "",
      classProgress:
        character.classProgress && typeof character.classProgress === "object"
          ? character.classProgress
          : {},
      hunterPets:
        character.hunterPets && typeof character.hunterPets === "object"
          ? character.hunterPets
          : { schemaVersion: 1, supported: false, pets: {}, count: 0 },
      active: normalizeQuestList(character.quests?.active),
      activeAccountShared: normalizeQuestList(
        character.quests?.activeAccountShared,
      ),
      completedObserved: normalizeQuestList(
        character.quests?.completedObserved,
      ),
      completedHistory: normalizeQuestList(character.quests?.completedHistory),
      completedAccountShared: normalizeQuestList(
        character.quests?.completedAccountShared,
      ),
      completedHistoryScannedAt:
        character.quests?.completedHistoryScannedAt || 0,
    }));

    // Une quête explicitement marquée « compte » par WoW est toujours rangée
    // dans la Bande de guerre. Pour l'historique ancien, WoW ne donne pas
    // toujours la portée. On considère donc aussi comme partagée une quête
    // présente sur au moins deux personnages et jamais observée comme remise
    // personnellement par le Collector.
    const occurrences = new Map();
    const observedIds = new Set();
    const accountRecords = new Map();
    const activeOccurrences = new Map();
    const accountActiveRecords = new Map();

    const collectorAccountActive = Array.isArray(
      collector.account?.quests?.activeShared,
    )
      ? collector.account.quests.activeShared
      : [];
    collectorAccountActive.forEach((quest) => {
      const id = questId(quest);
      if (id)
        accountActiveRecords.set(id, {
          ...quest,
          scope: "account",
          scopeReason: quest.scopeReason || "collector_account_active",
        });
    });

    const collectorAccountShared = Array.isArray(
      collector.account?.quests?.completedShared,
    )
      ? collector.account.quests.completedShared
      : [];
    collectorAccountShared.forEach((quest) => {
      const id = questId(quest);
      if (id)
        accountRecords.set(id, {
          ...quest,
          scope: "account",
          scopeReason: "collector_account_store",
        });
    });

    rawCharacters.forEach((character) => {
      character.active.forEach((quest) => {
        const id = questId(quest);
        if (!id) return;
        if (!activeOccurrences.has(id)) activeOccurrences.set(id, []);
        activeOccurrences
          .get(id)
          .push({ characterKey: questKey(character), quest });
        if (
          quest.isAccountQuest ||
          quest.isPetBattleQuest ||
          quest.scope === "account"
        ) {
          accountActiveRecords.set(id, {
            ...quest,
            scope: "account",
            scopeReason: quest.isAccountQuest
              ? "blizzard_account"
              : quest.isPetBattleQuest
                ? "pet_battle"
                : "collector_account_active",
          });
        }
      });

      character.activeAccountShared.forEach((quest) => {
        const id = questId(quest);
        if (!id) return;
        accountActiveRecords.set(id, {
          ...quest,
          scope: "account",
          scopeReason: quest.scopeReason || "collector_account_active",
        });
      });

      character.completedObserved.forEach((quest) => {
        const id = questId(quest);
        if (id) observedIds.add(id);
      });

      character.completedHistory.forEach((quest) => {
        const id = questId(quest);
        if (!id) return;
        if (!occurrences.has(id)) occurrences.set(id, []);
        occurrences.get(id).push({ characterKey: questKey(character), quest });
      });

      character.completedAccountShared.forEach((quest) => {
        const id = questId(quest);
        if (!id) return;
        accountRecords.set(id, {
          ...quest,
          scope: "account",
          scopeReason: quest.isAccountQuest
            ? "blizzard_account"
            : quest.isPetBattleQuest
              ? "pet_battle"
              : "collector_shared",
        });
      });
    });

    activeOccurrences.forEach((items, id) => {
      const distinctCharacters = new Set(
        items.map((item) => item.characterKey),
      );
      if (distinctCharacters.size >= 2 && !accountActiveRecords.has(id)) {
        accountActiveRecords.set(id, {
          ...items[0].quest,
          scope: "account",
          source: "account_active_inferred_from_roster",
          scopeReason: "active_on_multiple_characters",
          sharedCharacterCount: distinctCharacters.size,
        });
      }
    });

    occurrences.forEach((items, id) => {
      const distinctCharacters = new Set(
        items.map((item) => item.characterKey),
      );
      if (
        distinctCharacters.size >= 2 &&
        !observedIds.has(id) &&
        !accountRecords.has(id)
      ) {
        accountRecords.set(id, {
          ...items[0].quest,
          scope: "account",
          source: "account_inferred_from_roster",
          scopeReason: "shared_across_characters",
          sharedCharacterCount: distinctCharacters.size,
        });
      }
    });

    const accountIds = new Set(accountRecords.keys());
    const accountActiveIds = new Set(accountActiveRecords.keys());
    const characters = rawCharacters.map((character) => {
      const personalObservedIds = new Set(
        character.completedObserved.map(questId).filter(Boolean),
      );
      const personalActive = character.active.filter((quest) => {
        const id = questId(quest);
        return id && !accountActiveIds.has(id);
      });
      const personalHistory = character.completedHistory.filter((quest) => {
        const id = questId(quest);
        return id && (!accountIds.has(id) || personalObservedIds.has(id));
      });

      return {
        ...character,
        active: personalActive,
        activeCount: personalActive.length,
        activeAccountShared: [],
        activeAccountSharedCount: 0,
        completedHistory: personalHistory,
        completedHistoryCount: personalHistory.length,
        completedAccountShared: [],
        completedAccountSharedCount: 0,
      };
    });

    let accountCompleted = [...accountRecords.values()].sort(
      (a, b) => questId(a) - questId(b),
    );
    let accountActive = [...accountActiveRecords.values()].sort(
      (a, b) => questId(a) - questId(b),
    );

    const accessToken = req.session.blizzard_access_token || null;
    accountCompleted = await enrichQuestRewardMedia(
      accountCompleted,
      accessToken,
    );
    accountActive = await enrichQuestRewardMedia(accountActive, accessToken);

    for (const character of characters) {
      character.active = await enrichQuestRewardMedia(
        character.active,
        accessToken,
      );
      character.completedObserved = await enrichQuestRewardMedia(
        character.completedObserved,
        accessToken,
      );
      character.completedHistory = await enrichQuestRewardMedia(
        character.completedHistory,
        accessToken,
      );
    }

    return res.json({
      available: true,
      sourceUpdatedAt: collector.sourceUpdatedAt || 0,
      completedObserved: collector.questSummary?.completedObserved || [],
      account: {
        identityKey: "__account__",
        name: "Compte",
        realm: "Bande de guerre",
        active: accountActive,
        activeCount: accountActive.length,
        completedObserved: accountCompleted.filter((quest) =>
          String(quest.source || "").includes("observed_account"),
        ),
        completedHistory: accountCompleted,
        completedHistoryCount: accountCompleted.length,
        completedAccountShared: accountCompleted,
        completedAccountSharedCount: accountCompleted.length,
      },
      characters,
    });
  } catch (error) {
    console.error("Impossible de lire les quêtes du Collector :", error);
    return res
      .status(500)
      .json({
        available: false,
        account: null,
        characters: [],
        error: "collector_quests_unavailable",
      });
  }
});
const hunterPetIconCache = new Map();
router.get("/api/media/file/:fileId", async (req, res) => {
  const fileId = Number(req.params.fileId || 0);
  if (!fileId) return res.status(404).end();
  const cached = hunterPetIconCache.get(fileId);
  if (cached) return res.redirect(302, cached);
  const accessToken = req.session?.blizzard_access_token;
  if (!accessToken) return res.status(404).end();
  try {
    const url = `${BLIZZARD_API_ORIGIN}/data/wow/search/media?namespace=static-${BLIZZARD_REGION}&assets.file_data_id=${fileId}&_pageSize=1`;
    const payload = await fetchJsonWithRetry(url, accessToken, 2);
    const result = Array.isArray(payload?.results)
      ? payload.results[0]?.data
      : null;
    const assets = Array.isArray(result?.assets) ? result.assets : [];
    const asset =
      assets.find((item) => Number(item?.file_data_id || 0) === fileId) ||
      assets[0];
    if (!asset?.value) return res.status(404).end();
    hunterPetIconCache.set(fileId, asset.value);
    return res.redirect(302, asset.value);
  } catch (error) {
    console.warn(`Hunter pet media ${fileId} indisponible:`, error.message);
    return res.status(404).end();
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
