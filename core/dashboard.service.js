function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeIdentity(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function characterKey(character) {
  return `${normalizeIdentity(character?.realm)}::${normalizeIdentity(character?.name)}`;
}

function getSessions(character) {
  return Array.isArray(character?.sessions) ? character.sessions : [];
}

function collectSessionLocations(session) {
  return [session?.startLocation, session?.endLocation].filter(Boolean);
}

function buildDashboardSummary(battleNetCharacters = [], collectorCharacters = [], nowMs = Date.now()) {
  const collectorByKey = new Map(
    collectorCharacters.map((character) => [characterKey(character), character]),
  );
  const weekStartSeconds = Math.floor(nowMs / 1000) - 7 * 24 * 60 * 60;
  const sessions = collectorCharacters.flatMap(getSessions);
  const knownLocations = collectorCharacters.flatMap((character) => [
    character?.location,
    ...getSessions(character).flatMap(collectSessionLocations),
  ]).filter(Boolean);
  const uniqueZones = new Set(
    knownLocations
      .map((location) => String(location.zone || location.realZone || "").trim())
      .filter(Boolean),
  );
  const weekPlaySeconds = sessions.reduce((total, session) => {
    const startedAt = toNumber(session?.startedAt);
    const endedAt = toNumber(session?.endedAt);
    if (Math.max(startedAt, endedAt) < weekStartSeconds) return total;
    return total + toNumber(session?.durationSeconds);
  }, 0);
  const latestLocations = collectorCharacters
    .map((character) => ({
      name: character.name,
      realm: character.realm,
      location: character.location || null,
      timestamp: Math.max(
        toNumber(character.lastSeenAt),
        toNumber(character.lastLoginAt),
        toNumber(character.lastLogoutAt),
      ),
    }))
    .filter((entry) => entry.location?.zone || entry.location?.subZone)
    .sort((first, second) => second.timestamp - first.timestamp)
    .slice(0, 3);

  return {
    characterCount: battleNetCharacters.length,
    totalLevels: battleNetCharacters.reduce(
      (total, character) => total + toNumber(character.level),
      0,
    ),
    collectorCharacterCount: collectorByKey.size,
    sessionCount: sessions.length,
    uniqueZoneCount: uniqueZones.size,
    weekPlaySeconds,
    latestActivityAt: collectorCharacters.reduce(
      (latest, character) => Math.max(
        latest,
        toNumber(character.lastSeenAt),
        toNumber(character.lastLoginAt),
        toNumber(character.lastLogoutAt),
      ),
      0,
    ),
    latestLocations,
  };
}

module.exports = {
  buildDashboardSummary,
  characterKey,
};
