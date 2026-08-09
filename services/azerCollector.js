const fs = require("fs/promises");
const path = require("path");

const COLLECTOR_FILE_NAME = "AzerCompanionCollector.lua";
const MAX_COLLECTOR_FILE_SIZE = 25 * 1024 * 1024;
const MAX_LUA_NESTING_DEPTH = 120;
const MIN_LUA_NODE_LIMIT = 500000;
const MAX_LUA_NODE_LIMIT = 5000000;
const DEFAULT_WOW_INSTALL_PATH =
  "C:\\Program Files (x86)\\World of Warcraft";

class LuaSavedVariablesParser {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.nodeCount = 0;
    // Le Collector 2.0 peut produire plusieurs centaines de milliers de
    // valeurs (hauts faits, critères et quêtes). La limite évolue avec la
    // taille du fichier tout en restant bornée pour éviter un fichier abusif.
    this.maxNodeCount = Math.min(
      MAX_LUA_NODE_LIMIT,
      Math.max(MIN_LUA_NODE_LIMIT, Math.ceil(source.length / 3)),
    );
  }

  parse() {
    this.skipIgnored();
    const variableName = this.parseIdentifier();

    if (variableName !== "AzerCompanionDB") {
      throw new Error("Table AzerCompanionDB absente.");
    }

    this.skipIgnored();
    this.expect("=");
    const value = this.parseValue(0);
    this.skipIgnored();

    return value;
  }

  current() {
    return this.source[this.position];
  }

  expect(character) {
    if (this.current() !== character) {
      throw new Error(
        `Caractère « ${character} » attendu à la position ${this.position}.`,
      );
    }

    this.position += 1;
  }

  skipIgnored() {
    while (this.position < this.source.length) {
      if (/\s/.test(this.current())) {
        this.position += 1;
        continue;
      }

      if (this.source.startsWith("--[[", this.position)) {
        const commentEnd = this.source.indexOf("]]", this.position + 4);
        this.position =
          commentEnd === -1 ? this.source.length : commentEnd + 2;
        continue;
      }

      if (this.source.startsWith("--", this.position)) {
        const lineEnd = this.source.indexOf("\n", this.position + 2);
        this.position = lineEnd === -1 ? this.source.length : lineEnd + 1;
        continue;
      }

      break;
    }
  }

  parseIdentifier() {
    const start = this.position;

    if (!/[A-Za-z_]/.test(this.current() || "")) {
      throw new Error(`Identifiant Lua invalide à la position ${this.position}.`);
    }

    this.position += 1;
    while (/[A-Za-z0-9_]/.test(this.current() || "")) {
      this.position += 1;
    }

    return this.source.slice(start, this.position);
  }

  parseNumber() {
    const match = this.source
      .slice(this.position)
      .match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);

    if (!match) {
      throw new Error(`Nombre Lua invalide à la position ${this.position}.`);
    }

    this.position += match[0].length;
    return Number(match[0]);
  }

  parseString() {
    const quote = this.current();
    let value = "";

    this.position += 1;
    while (this.position < this.source.length) {
      const character = this.current();
      this.position += 1;

      if (character === quote) {
        return value;
      }

      if (character !== "\\") {
        value += character;
        continue;
      }

      const escaped = this.current();
      this.position += 1;

      const simpleEscapes = {
        a: "\x07",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        v: "\v",
        "\\": "\\",
        '"': '"',
        "'": "'",
      };

      if (Object.hasOwn(simpleEscapes, escaped)) {
        value += simpleEscapes[escaped];
        continue;
      }

      if (/\d/.test(escaped || "")) {
        let decimalEscape = escaped;

        while (
          decimalEscape.length < 3 &&
          /\d/.test(this.current() || "")
        ) {
          decimalEscape += this.current();
          this.position += 1;
        }

        value += String.fromCharCode(Number(decimalEscape));
        continue;
      }

      value += escaped || "";
    }

    throw new Error("Chaîne Lua non terminée.");
  }

  parseValue(depth) {
    if (depth > MAX_LUA_NESTING_DEPTH) {
      throw new Error(
        `Imbrication excessive dans le fichier du collecteur (>${MAX_LUA_NESTING_DEPTH}).`,
      );
    }

    this.nodeCount += 1;
    if (this.nodeCount > this.maxNodeCount) {
      throw new Error(
        `Fichier du collecteur trop complexe (${this.nodeCount} valeurs, limite ${this.maxNodeCount}).`,
      );
    }

    this.skipIgnored();
    const character = this.current();

    if (character === "{") {
      return this.parseTable(depth + 1);
    }

    if (character === '"' || character === "'") {
      return this.parseString();
    }

    if (character === "-" || /\d/.test(character || "")) {
      return this.parseNumber();
    }

    const identifier = this.parseIdentifier();
    if (identifier === "true") return true;
    if (identifier === "false") return false;
    if (identifier === "nil") return null;

    throw new Error(`Valeur Lua non prise en charge : ${identifier}.`);
  }

  parseTable(depth) {
    const keyedValues = Object.create(null);
    const arrayValues = [];
    let hasKeyedValues = false;

    this.expect("{");
    this.skipIgnored();

    while (this.current() !== "}") {
      if (this.position >= this.source.length) {
        throw new Error("Table Lua non terminée.");
      }

      if (this.current() === "[") {
        this.position += 1;
        const key = this.parseValue(depth);
        this.skipIgnored();
        this.expect("]");
        this.skipIgnored();
        this.expect("=");
        keyedValues[String(key)] = this.parseValue(depth);
        hasKeyedValues = true;
      } else {
        const fieldStart = this.position;
        let parsedAsNamedField = false;

        if (/[A-Za-z_]/.test(this.current() || "")) {
          const key = this.parseIdentifier();
          this.skipIgnored();

          if (this.current() === "=") {
            this.position += 1;
            keyedValues[key] = this.parseValue(depth);
            hasKeyedValues = true;
            parsedAsNamedField = true;
          } else {
            this.position = fieldStart;
          }
        }

        if (!parsedAsNamedField) {
          arrayValues.push(this.parseValue(depth));
        }
      }

      this.skipIgnored();
      if (this.current() === "," || this.current() === ";") {
        this.position += 1;
        this.skipIgnored();
      }
    }

    this.expect("}");

    if (!hasKeyedValues) {
      return arrayValues;
    }

    arrayValues.forEach((value, index) => {
      keyedValues[String(index + 1)] = value;
    });

    return keyedValues;
  }
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function latestSession(sessions) {
  if (Array.isArray(sessions)) {
    return sessions.at(-1) || null;
  }

  if (!sessions || typeof sessions !== "object") {
    return null;
  }

  return Object.entries(sessions)
    .filter(([key]) => /^\d+$/.test(key))
    .sort(([firstKey], [secondKey]) => Number(firstKey) - Number(secondKey))
    .at(-1)?.[1] || null;
}

function normalizeLocation(...locations) {
  const validLocations = locations.filter(
    (location) => location && typeof location === "object",
  );

  if (!validLocations.length) {
    return null;
  }

  const firstTextValue = (key) =>
    validLocations
      .map((location) => String(location[key] || "").trim())
      .find(Boolean) || "";
  const firstNumberValue = (key) =>
    validLocations
      .map((location) => toFiniteNumber(location[key]))
      .find((value) => value !== null) ?? null;

  return {
    zone: firstTextValue("zone") || firstTextValue("realZone"),
    subZone: firstTextValue("subZone"),
    mapId: firstNumberValue("mapID"),
    x: firstNumberValue("x"),
    y: firstNumberValue("y"),
  };
}

function normalizeSessions(sessions) {
  const values = Array.isArray(sessions)
    ? sessions
    : Object.entries(sessions || {})
        .filter(([key]) => /^\d+$/.test(key))
        .sort(([firstKey], [secondKey]) => Number(firstKey) - Number(secondKey))
        .map(([, value]) => value);

  return values
    .filter((session) => session && typeof session === "object")
    .map((session) => ({
      id: String(session.id || ""),
      startedAt: toFiniteNumber(session.startedAt),
      endedAt: toFiniteNumber(session.endedAt),
      durationSeconds: toFiniteNumber(session.durationSeconds),
      endReason: String(session.endReason || ""),
      startLocation: normalizeLocation(session.startLocation),
      endLocation: normalizeLocation(session.endLocation),
    }));
}


function normalizeAchievements(achievements) {
  const values = Array.isArray(achievements)
    ? achievements
    : Object.entries(achievements || {})
        .filter(([key]) => /^\d+$/.test(key))
        .sort(([firstKey], [secondKey]) => Number(firstKey) - Number(secondKey))
        .map(([, value]) => value);

  return values
    .filter((achievement) => achievement && typeof achievement === "object")
    .map((achievement) => ({
      id: toFiniteNumber(achievement.id),
      name: String(achievement.name || ""),
      description: String(achievement.description || ""),
      points: toFiniteNumber(achievement.points),
      icon: toFiniteNumber(achievement.icon),
      completed: achievement.completed === true,
      completedAt: toFiniteNumber(achievement.completedAt),
      observedEarnedAt: toFiniteNumber(achievement.observedEarnedAt),
      wasEarnedByMe: achievement.wasEarnedByMe === true,
      earnedBy: String(achievement.earnedBy || ""),
      characterGuid: String(achievement.characterGuid || ""),
      characterName: String(achievement.characterName || ""),
      characterRealm: String(achievement.characterRealm || ""),
    }));
}

function normalizeCharacter(character, storageKey = "") {
  const sessions = normalizeSessions(character.sessions);
  const session = sessions.at(-1) || null;
  const location = normalizeLocation(
    session?.endLocation,
    character.location,
    session?.startLocation,
  );

  return {
    storageKey: String(storageKey || character.storageKey || ""),
    identityKey: String(character.key || ""),
    guid: String(character.guid || ""),
    name: String(character.name || ""),
    realm: String(character.realm || ""),
    level: toFiniteNumber(character.profile?.level),
    className: String(character.profile?.className || ""),
    classId: toFiniteNumber(character.profile?.classID),
    raceName: String(character.profile?.raceName || ""),
    raceId: toFiniteNumber(character.profile?.raceID),
    faction: String(character.profile?.faction || ""),
    appearance: {
      raceID: toFiniteNumber(character.appearance?.raceID),
      raceName: String(character.appearance?.raceName || character.profile?.raceName || ""),
      raceFile: String(character.appearance?.raceFile || ""),
      raceSlug: String(character.appearance?.raceSlug || ""),
      classID: toFiniteNumber(character.appearance?.classID),
      className: String(character.appearance?.className || character.profile?.className || ""),
      classFile: String(character.appearance?.classFile || ""),
      classSlug: String(character.appearance?.classSlug || ""),
      sexID: toFiniteNumber(character.appearance?.sexID),
      sex: String(character.appearance?.sex || ""),
      faction: String(character.appearance?.faction || character.profile?.faction || ""),
      displayID: toFiniteNumber(character.appearance?.displayID),
      portraitKey: String(character.appearance?.portraitKey || ""),
      portraitSlug: String(character.appearance?.portraitSlug || ""),
      capturedAt: toFiniteNumber(character.appearance?.capturedAt),
    },
    equipment: character.equipment && typeof character.equipment === "object"
      ? character.equipment
      : { schemaVersion: 1, slots: {}, equippedCount: 0 },
    hero: character.hero && typeof character.hero === "object"
      ? character.hero
      : null,
    media: {
      unitGUID: String(character.media?.unitGUID || ""),
      displayID: toFiniteNumber(character.media?.displayID),
      portraitKey: String(character.media?.portraitKey || character.appearance?.portraitKey || ""),
      portraitSlug: String(character.media?.portraitSlug || character.appearance?.portraitSlug || ""),
      portraitAvailableInClient: character.media?.portraitAvailableInClient === true,
      modelAvailableInClient: character.media?.modelAvailableInClient === true,
      captureMethod: String(character.media?.captureMethod || ""),
      capturedAt: toFiniteNumber(character.media?.capturedAt),
    },
    money: toFiniteNumber(character.profile?.money),
    professions: Array.isArray(character.professions)
      ? character.professions
      : Object.values(character.professions || {}),
    achievements: normalizeAchievements(character.achievements),
    quests: {
      active: Object.values(character.quests?.active || {}),
      completedObserved: Array.isArray(character.quests?.completedObserved)
        ? character.quests.completedObserved
        : Object.values(character.quests?.completedObserved || {}),
      completedHistory: Object.values(character.quests?.completedHistory || {}),
      completedHistoryCount: toFiniteNumber(character.quests?.completedHistoryCount),
      completedAccountShared: Object.values(character.quests?.completedAccountShared || {}),
      completedAccountSharedCount: toFiniteNumber(character.quests?.completedAccountSharedCount),
      completedHistoryScannedAt: toFiniteNumber(character.quests?.completedHistoryScannedAt),
    },
    lastLoginAt: toFiniteNumber(character.lastLoginAt),
    lastLogoutAt: toFiniteNumber(character.lastLogoutAt),
    lastSeenAt: toFiniteNumber(character.lastSeenAt),
    reportedOnline: character.online === true,
    location,
    sessions,
    latestSession: session,
    currentSession: character.currentSession && typeof character.currentSession === "object"
      ? {
          id: String(character.currentSession.id || ""),
          startedAt: toFiniteNumber(character.currentSession.startedAt),
          startLocation: normalizeLocation(character.currentSession.startLocation),
        }
      : null,
  };
}

async function findCollectorFile() {
  if (process.env.AZER_COLLECTOR_FILE) {
    return process.env.AZER_COLLECTOR_FILE;
  }

  const wowInstallPath =
    process.env.WOW_INSTALL_PATH || DEFAULT_WOW_INSTALL_PATH;
  const accountsPath = path.join(
    wowInstallPath,
    "_retail_",
    "WTF",
    "Account",
  );
  const accounts = await fs.readdir(accountsPath, { withFileTypes: true });
  const candidates = [];

  for (const account of accounts) {
    if (!account.isDirectory()) continue;

    const candidate = path.join(
      accountsPath,
      account.name,
      "SavedVariables",
      COLLECTOR_FILE_NAME,
    );

    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) {
        candidates.push({ path: candidate, modifiedAt: stats.mtimeMs });
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  candidates.sort((first, second) => second.modifiedAt - first.modifiedAt);
  return candidates[0]?.path || null;
}

async function readCollectorSummary() {
  const collectorFile = await findCollectorFile();

  if (!collectorFile) {
    return {
      available: false,
      characters: [],
    };
  }

  const stats = await fs.stat(collectorFile);
  if (stats.size > MAX_COLLECTOR_FILE_SIZE) {
    throw new Error("Le fichier du collecteur dépasse la taille permise.");
  }

  const source = await fs.readFile(collectorFile, "utf8");
  const database = new LuaSavedVariablesParser(source).parse();
  const characters = Object.entries(database.characters || {})
    .filter(([, character]) => character && typeof character === "object")
    .map(([storageKey, character]) => normalizeCharacter(character, storageKey));

  return {
    available: true,
    sourceUpdatedAt: Math.floor(stats.mtimeMs / 1000),
    dataUpdatedAt: toFiniteNumber(database.account?.updatedAt),
    lastCharacterGuid: String(database.account?.lastCharacterGuid || ""),
    achievements: normalizeAchievements(database.account?.achievements),
    achievementSummary: database.account?.achievementSummary || {},
    account: {
      quests: {
        activeShared: Object.values(database.account?.quests?.activeShared || {}),
        activeSharedCount: toFiniteNumber(database.account?.quests?.activeSharedCount),
        completedShared: Object.values(database.account?.quests?.completedShared || {}),
        completedSharedCount: toFiniteNumber(database.account?.quests?.completedSharedCount),
        completedObserved: Object.values(database.account?.quests?.completedObserved || {}),
      },
    },
    questSummary: {
      completedObserved: Object.values(
        database.account?.quests?.completedObserved || {},
      ),
      completedShared: Object.values(
        database.account?.quests?.completedShared || {},
      ),
    },
    sync: database.sync || {},
    characters,
  };
}

module.exports = {
  readCollectorSummary,
};
