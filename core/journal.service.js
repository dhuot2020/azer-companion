function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function locationLabel(location) {
  if (!location || typeof location !== "object") return "";

  return [location.subZone, location.zone || location.realZone]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ");
}

function sameLocation(first, second) {
  const firstLabel = locationLabel(first).toLowerCase();
  const secondLabel = locationLabel(second).toLowerCase();
  return Boolean(firstLabel && secondLabel && firstLabel === secondLabel);
}

function addArchivedSessionEvents(events, character, session) {
  const identity = {
    characterGuid: character.guid,
    characterName: character.name,
    realm: character.realm,
  };
  const startedAt = toNumber(session.startedAt);
  const endedAt = toNumber(session.endedAt);
  const startLocation = session.startLocation || null;
  const endLocation = session.endLocation || null;

  if (startedAt > 0) {
    events.push({
      ...identity,
      id: `${session.id || startedAt}:start`,
      type: "SESSION_STARTED",
      timestamp: startedAt,
      location: startLocation,
    });
  }

  if (
    endedAt > 0 &&
    startLocation &&
    endLocation &&
    !sameLocation(startLocation, endLocation)
  ) {
    events.push({
      ...identity,
      id: `${session.id || endedAt}:travel`,
      type: "TRAVEL_RECORDED",
      timestamp: endedAt,
      fromLocation: startLocation,
      location: endLocation,
    });
  }

  if (endedAt > 0) {
    events.push({
      ...identity,
      id: `${session.id || endedAt}:end`,
      type: "SESSION_ENDED",
      timestamp: endedAt,
      durationSeconds: toNumber(session.durationSeconds),
      location: endLocation,
      endReason: session.endReason || "",
    });
  }
}

function addCurrentSessionEvent(events, character) {
  const session = character.currentSession;
  if (!session || !session.startedAt) return;

  events.push({
    id: `${session.id || session.startedAt}:online`,
    type: "SESSION_ACTIVE",
    timestamp: toNumber(session.startedAt),
    characterGuid: character.guid,
    characterName: character.name,
    realm: character.realm,
    location: character.location || session.startLocation || null,
    startedAt: toNumber(session.startedAt),
  });
}

function buildSessionJournal(collectorCharacters = [], limit = 20) {
  const events = [];

  for (const character of collectorCharacters) {
    for (const session of character.sessions || []) {
      addArchivedSessionEvents(events, character, session);
    }

    addCurrentSessionEvent(events, character);
  }

  return events
    .filter((event) => event.timestamp > 0)
    .sort((first, second) => {
      if (second.timestamp !== first.timestamp) {
        return second.timestamp - first.timestamp;
      }

      const priority = {
        SESSION_ACTIVE: 4,
        SESSION_ENDED: 3,
        TRAVEL_RECORDED: 2,
        SESSION_STARTED: 1,
      };
      return (priority[second.type] || 0) - (priority[first.type] || 0);
    })
    .slice(0, Math.max(1, Number(limit) || 20));
}

module.exports = {
  buildSessionJournal,
  locationLabel,
};
