const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(process.cwd(), "data", "cache");
const STATE_FILE = path.join(CACHE_DIR, "ase-event-state.json");
const EVENTS_FILE = path.join(CACHE_DIR, "ase-events.json");
const MAX_EVENTS = 500;

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  ensureCacheDir();
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

function loadState() {
  return readJson(STATE_FILE, {
    schemaVersion: 1,
    initializedAt: 0,
    updatedAt: 0,
    characters: {},
    achievements: {},
    journalEventIds: {},
  });
}

function saveState(state) {
  writeJsonAtomic(STATE_FILE, state);
}

function loadEvents() {
  const payload = readJson(EVENTS_FILE, { schemaVersion: 1, events: [] });
  return Array.isArray(payload.events) ? payload.events : [];
}

function saveEvents(events) {
  const ordered = [...events]
    .filter((event) => event && event.id)
    .sort((first, second) => Number(second.timestamp || 0) - Number(first.timestamp || 0))
    .slice(0, MAX_EVENTS);

  writeJsonAtomic(EVENTS_FILE, {
    schemaVersion: 1,
    updatedAt: Date.now(),
    events: ordered,
  });
  return ordered;
}

module.exports = {
  loadState,
  saveState,
  loadEvents,
  saveEvents,
  paths: { STATE_FILE, EVENTS_FILE },
};
