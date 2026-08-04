const {
  buildIdentityKey,
  finiteNumber,
  newestTimestamp,
  normalizeText,
} = require("./utils");

const version = "1.0.0";

function indexCollectorCharacters(collectorCharacters = []) {
  const byIdentity = new Map();
  const byGuid = new Map();

  for (const character of collectorCharacters) {
    const identityKey = buildIdentityKey(character);
    if (identityKey !== "::") byIdentity.set(identityKey, character);
    if (character?.guid) byGuid.set(String(character.guid), character);
  }

  return { byIdentity, byGuid };
}

function resolveCollectorCharacter(character, indexes) {
  if (!character) return null;
  const identityKey = buildIdentityKey(character);
  return indexes.byIdentity.get(identityKey) || null;
}

function buildCharacterRecord(character, collectorCharacter = null) {
  const appearance = collectorCharacter?.appearance || {};
  const collectorMedia = collectorCharacter?.media || {};
  const lastSeenAt = newestTimestamp(
    collectorCharacter?.lastSeenAt,
    collectorCharacter?.lastLoginAt,
    collectorCharacter?.lastLogoutAt,
    appearance.capturedAt,
    collectorMedia.capturedAt,
  );

  const identityKey = buildIdentityKey(character);
  const raceName = normalizeText(appearance.raceName || collectorCharacter?.raceName || "");
  const className = normalizeText(appearance.className || collectorCharacter?.className || "");
  const faction = normalizeText(appearance.faction || collectorCharacter?.faction || character.faction || "");
  const gender = normalizeText(appearance.sex || character.gender || "").toLowerCase();

  return {
    ...character,
    characterKey: character.characterKey || identityKey,
    ase: {
      schemaVersion: 1,
      identityKey,
      sources: {
        battleNet: true,
        collector: Boolean(collectorCharacter),
      },
      identity: {
        id: finiteNumber(character.id),
        guid: normalizeText(collectorCharacter?.guid),
        name: normalizeText(character.name),
        realm: normalizeText(character.realmSlug || character.realm),
      },
      appearance: {
        raceId: finiteNumber(appearance.raceID || character.raceId || collectorCharacter?.raceId),
        raceName,
        raceSlug: normalizeText(appearance.raceSlug),
        classId: finiteNumber(appearance.classID || character.classId || collectorCharacter?.classId),
        className,
        classSlug: normalizeText(appearance.classSlug),
        gender,
        faction,
        displayId: finiteNumber(appearance.displayID || collectorMedia.displayID),
        portraitKey: normalizeText(appearance.portraitKey || collectorMedia.portraitKey),
        portraitSlug: normalizeText(appearance.portraitSlug || collectorMedia.portraitSlug),
      },
      progression: {
        level: finiteNumber(character.level || collectorCharacter?.level),
        money: finiteNumber(collectorCharacter?.money),
      },
      location: collectorCharacter?.location || null,
      activity: {
        lastSeenAt,
        lastLoginAt: finiteNumber(collectorCharacter?.lastLoginAt),
        lastLogoutAt: finiteNumber(collectorCharacter?.lastLogoutAt),
        online: collectorCharacter?.reportedOnline === true,
      },
      media: {
        source: normalizeText(character.portraitSource || character.mediaSource || "blizzard"),
        status: normalizeText(character.mediaStatus || "unknown"),
        avatar: character.avatar || null,
        portrait: character.inset || character.portrait || null,
        fullBody: character.main || character.fullBody || null,
        modelAvailableInClient: collectorMedia.modelAvailableInClient === true,
        portraitAvailableInClient: collectorMedia.portraitAvailableInClient === true,
      },
    },
    collector: collectorCharacter
      ? {
          available: true,
          guid: collectorCharacter.guid || "",
          lastSeenAt,
          appearance,
          media: collectorMedia,
          location: collectorCharacter.location || null,
        }
      : { available: false },
    raceName: raceName || character.raceName || "",
    className: className || character.className || "",
    gender: gender || character.gender || "",
    lastSeenAt,
  };
}

function buildCharacters({ characters = [], collectorCharacters = [] } = {}) {
  const indexes = indexCollectorCharacters(collectorCharacters);
  const records = characters.map((character) =>
    buildCharacterRecord(character, resolveCollectorCharacter(character, indexes)),
  );

  const matchedKeys = new Set(records.map((character) => character.ase.identityKey));
  const collectorOnly = collectorCharacters.filter(
    (character) => !matchedKeys.has(buildIdentityKey(character)),
  );

  const lastPlayed = [...records]
    .filter((character) => character.ase.activity.lastSeenAt > 0)
    .sort((first, second) => second.ase.activity.lastSeenAt - first.ase.activity.lastSeenAt)[0] || null;

  return {
    characters: records,
    summary: {
      total: records.length,
      collectorMatched: records.filter((character) => character.collector.available).length,
      collectorOnly: collectorOnly.length,
      lastPlayedKey: lastPlayed?.ase.identityKey || "",
      lastPlayedName: lastPlayed?.name || "",
    },
    collectorOnly,
  };
}

module.exports = {
  version,
  ready: true,
  buildCharacters,
  buildCharacterRecord,
};
