const crypto = require("crypto");
const store = require("./store");
const { buildQuestIndex, enrichEvent } = require("./enrichment");

const version = "1.0.1";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value || "").trim();
}

function eventId(parts) {
  return crypto.createHash("sha1").update(parts.join("|")).digest("hex");
}

function normalizeQuestId(quest) {
  return number(quest?.id || quest?.questID || quest?.questId);
}

function getCompletedQuestIds(collectorCharacter) {
  const quests = collectorCharacter?.quests || {};
  const values = [
    ...(Array.isArray(quests.completedHistory) ? quests.completedHistory : []),
    ...(Array.isArray(quests.completedObserved) ? quests.completedObserved : []),
  ];

  return [...new Set(values.map(normalizeQuestId).filter((id) => id > 0))].sort(
    (first, second) => first - second,
  );
}

function snapshotCharacter(character) {
  const collector = character?.collector?.available ? character.collector : null;
  const collectorSource = character?._collectorSource || null;
  return {
    identityKey: text(character?.ase?.identityKey || character?.characterKey),
    id: number(character?.id),
    guid: text(character?.ase?.identity?.guid || collector?.guid),
    name: text(character?.name),
    realm: text(character?.realmSlug || character?.realm),
    level: number(character?.ase?.progression?.level || character?.level),
    money: number(character?.ase?.progression?.money),
    lastSeenAt: number(character?.ase?.activity?.lastSeenAt || character?.lastSeenAt),
    zone: text(character?.ase?.location?.zone),
    subZone: text(character?.ase?.location?.subZone),
    completedQuestIds: getCompletedQuestIds(collectorSource),
  };
}

function createEvent(type, timestamp, character, details = {}) {
  const stableTimestamp = number(timestamp) || Math.floor(Date.now() / 1000);
  const identityKey = text(character.identityKey);
  return {
    id: eventId([type, identityKey, stableTimestamp, JSON.stringify(details)]),
    type,
    timestamp: stableTimestamp,
    characterKey: identityKey,
    characterGuid: text(character.guid),
    characterName: text(character.name),
    realm: text(character.realm),
    details,
    source: "ase-event-engine",
  };
}

function compareCharacter(previous, current) {
  const events = [];
  const timestamp = current.lastSeenAt || Math.floor(Date.now() / 1000);

  if (previous.level > 0 && current.level > previous.level) {
    events.push(
      createEvent("LEVEL_UP", timestamp, current, {
        previousLevel: previous.level,
        level: current.level,
        gainedLevels: current.level - previous.level,
      }),
    );
  }

  const previousQuests = new Set(previous.completedQuestIds || []);
  for (const questId of current.completedQuestIds || []) {
    if (!previousQuests.has(questId)) {
      events.push(
        createEvent("QUEST_COMPLETED", timestamp, current, {
          questId,
        }),
      );
    }
  }

  if (previous.zone && current.zone && previous.zone !== current.zone) {
    events.push(
      createEvent("ZONE_CHANGED", timestamp, current, {
        previousZone: previous.zone,
        zone: current.zone,
        subZone: current.subZone,
      }),
    );
  }

  return events;
}

function achievementKey(achievement) {
  return `${number(achievement?.id)}:${number(achievement?.earnedAt || achievement?.completedAt)}`;
}

function collectAchievementEvents(achievements, knownAchievements, initialized) {
  const events = [];
  const nextKnown = { ...knownAchievements };

  for (const achievement of achievements || []) {
    const id = number(achievement?.id);
    const earnedAt = number(achievement?.earnedAt || achievement?.completedAt);
    if (!id || !earnedAt) continue;

    const key = achievementKey(achievement);
    if (!nextKnown[key] && initialized) {
      const character = {
        identityKey: `${text(achievement.characterRealm).toLowerCase()}::${text(achievement.characterName).toLowerCase()}`,
        guid: text(achievement.characterGuid),
        name: text(achievement.characterName),
        realm: text(achievement.characterRealm),
      };
      events.push(
        createEvent("ACHIEVEMENT_EARNED", earnedAt, character, {
          achievementId: id,
          name: text(achievement.name) || "Haut fait obtenu",
          description: text(achievement.description),
          points: number(achievement.points),
          wasEarnedByMe: achievement.wasEarnedByMe === true,
        }),
      );
    }
    nextKnown[key] = earnedAt;
  }

  return { events, knownAchievements: nextKnown };
}

function normalizeJournalEvent(event) {
  const timestamp = number(event?.timestamp);
  const type = text(event?.type);
  const sourceId = text(event?.id);
  if (!timestamp || !type || !sourceId) return null;

  return {
    id: `collector:${sourceId}`,
    type,
    timestamp,
    characterKey: `${text(event.realm).toLowerCase()}::${text(event.characterName).toLowerCase()}`,
    characterGuid: text(event.characterGuid),
    characterName: text(event.characterName),
    realm: text(event.realm),
    details: {
      location: event.location || null,
      fromLocation: event.fromLocation || null,
      durationSeconds: number(event.durationSeconds),
      endReason: text(event.endReason),
    },
    source: "collector-journal",
  };
}

function buildEvents({ characters = [], collectorCharacters = [], achievements = [], journal = [] } = {}) {
  const state = store.loadState();
  const initialized = number(state.initializedAt) > 0;
  const existingEvents = store.loadEvents();
  const knownEventIds = new Set(existingEvents.map((event) => event.id));
  const collectorByKey = new Map(
    collectorCharacters.map((character) => [
      `${text(character.realm).toLowerCase()}::${text(character.name).toLowerCase()}`,
      character,
    ]),
  );

  const nextCharacters = {};
  const generated = [];
  const comparisons = {};

  for (const originalCharacter of characters) {
    const identityKey = text(originalCharacter?.ase?.identityKey || originalCharacter?.characterKey);
    const character = {
      ...originalCharacter,
      _collectorSource: collectorByKey.get(identityKey) || null,
    };
    const current = snapshotCharacter(character);
    if (!current.identityKey) continue;
    const previous = state.characters?.[current.identityKey];
    const characterEvents = initialized && previous
      ? compareCharacter(previous, current)
      : [];

    generated.push(...characterEvents);
    comparisons[current.identityKey] = {
      characterName: current.name,
      realm: current.realm,
      hadPreviousSnapshot: Boolean(previous),
      previous: previous || null,
      current,
      differences: {
        levelChanged: Boolean(previous) && previous.level !== current.level,
        previousLevel: number(previous?.level),
        currentLevel: number(current.level),
        gainedLevels: Math.max(0, number(current.level) - number(previous?.level)),
        zoneChanged: Boolean(previous?.zone && current.zone && previous.zone !== current.zone),
        previousZone: text(previous?.zone),
        currentZone: text(current.zone),
        newCompletedQuestIds: previous
          ? (current.completedQuestIds || []).filter(
              (questId) => !(previous.completedQuestIds || []).includes(questId),
            )
          : [],
      },
      generatedEventTypes: characterEvents.map((event) => event.type),
    };
    nextCharacters[current.identityKey] = current;
  }

  const achievementResult = collectAchievementEvents(
    achievements,
    state.achievements || {},
    initialized,
  );
  generated.push(...achievementResult.events);

  const journalEventIds = { ...(state.journalEventIds || {}) };
  for (const rawEvent of journal || []) {
    const event = normalizeJournalEvent(rawEvent);
    if (!event) continue;
    if (initialized && !journalEventIds[event.id]) generated.push(event);
    journalEventIds[event.id] = event.timestamp;
  }

  const questIndex = buildQuestIndex(collectorCharacters);
  const enrichedGenerated = generated.map((event) =>
    enrichEvent(event, { questIndex }),
  );
  const enrichedExistingEvents = existingEvents.map((event) =>
    enrichEvent(event, { questIndex }),
  );

  const uniqueGenerated = enrichedGenerated.filter((event) => {
    if (knownEventIds.has(event.id)) return false;
    knownEventIds.add(event.id);
    return true;
  });

  const now = Date.now();
  store.saveState({
    schemaVersion: 1,
    initializedAt: initialized ? state.initializedAt : now,
    updatedAt: now,
    characters: nextCharacters,
    achievements: achievementResult.knownAchievements,
    journalEventIds,
    diagnostics: {
      generatedAt: now,
      comparisons,
    },
  });

  const events = store.saveEvents([...uniqueGenerated, ...enrichedExistingEvents]);
  return {
    events,
    newEvents: uniqueGenerated,
    summary: {
      initialized: true,
      baselineCreated: !initialized,
      total: events.length,
      generated: uniqueGenerated.length,
      latestAt: number(events[0]?.timestamp),
    },
  };
}

function getDebug({ characterKey = "" } = {}) {
  const state = store.loadState();
  const comparisons = state?.diagnostics?.comparisons || {};
  const normalizedCharacterKey = text(characterKey).toLowerCase();
  const selectedComparisons = normalizedCharacterKey
    ? { [normalizedCharacterKey]: comparisons[normalizedCharacterKey] || null }
    : comparisons;

  return {
    initializedAt: number(state.initializedAt),
    updatedAt: number(state.updatedAt),
    generatedAt: number(state?.diagnostics?.generatedAt),
    stateFile: store.paths.STATE_FILE,
    eventsFile: store.paths.EVENTS_FILE,
    comparisons: selectedComparisons,
  };
}

function listEvents({ limit = 50, characterKey = "", types = [] } = {}) {
  const normalizedTypes = new Set((Array.isArray(types) ? types : [types]).map(text).filter(Boolean));
  const normalizedCharacterKey = text(characterKey).toLowerCase();
  return store
    .loadEvents()
    .filter((event) => !normalizedCharacterKey || text(event.characterKey).toLowerCase() === normalizedCharacterKey)
    .filter((event) => normalizedTypes.size === 0 || normalizedTypes.has(event.type))
    .slice(0, Math.max(1, Math.min(500, number(limit) || 50)));
}

module.exports = {
  version,
  ready: true,
  buildEvents,
  listEvents,
  getDebug,
};
