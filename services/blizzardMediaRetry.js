const fs = require("fs");
const path = require("path");

const RETRY_FILE = path.join(process.cwd(), "data", "cache", "blizzard-media-retry.json");
const DEFAULT_DELAY_MS = 5 * 60 * 1000;
const MAX_DELAY_MS = 6 * 60 * 60 * 1000;

function normalizePart(value) {
  return String(value || "").normalize("NFKC").trim().toLowerCase();
}

function getKey(character) {
  return `${normalizePart(character?.realm)}::${normalizePart(character?.name)}`;
}

function readState() {
  try {
    if (!fs.existsSync(RETRY_FILE)) return { version: 1, characters: {} };
    const data = JSON.parse(fs.readFileSync(RETRY_FILE, "utf8"));
    return {
      version: 1,
      characters: data && typeof data.characters === "object" ? data.characters : {},
    };
  } catch (error) {
    console.warn("Blizzard Sync Engine : file de reprise illisible.", error.message);
    return { version: 1, characters: {} };
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(RETRY_FILE), { recursive: true });
  fs.writeFileSync(
    RETRY_FILE,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

let state = readState();

function schedule(character, details = {}) {
  const key = getKey(character);
  if (!key || key === "::") return null;

  const previous = state.characters[key] || {};
  const attempts = Number(previous.attempts || 0) + 1;
  const delayMs = Math.min(
    MAX_DELAY_MS,
    DEFAULT_DELAY_MS * Math.pow(2, Math.max(0, attempts - 1)),
  );
  const now = Date.now();

  const entry = {
    key,
    id: character?.id || previous.id || null,
    name: character?.name || previous.name || "",
    realm: character?.realm || previous.realm || "",
    level: Number(character?.level || previous.level || 0),
    status: "waiting",
    attempts,
    lastCheckedAt: now,
    nextCheckAt: now + delayMs,
    profileStatus: details.profileStatus ?? previous.profileStatus ?? null,
    mediaStatus: details.mediaStatus ?? previous.mediaStatus ?? null,
    reason: details.reason || previous.reason || "Média Blizzard indisponible.",
  };

  state.characters[key] = entry;
  writeState(state);
  return entry;
}

function resolve(character, details = {}) {
  const key = getKey(character);
  if (!key || !state.characters[key]) return null;

  const entry = {
    ...state.characters[key],
    status: "resolved",
    resolvedAt: Date.now(),
    lastCheckedAt: Date.now(),
    nextCheckAt: null,
    profileStatus: details.profileStatus ?? state.characters[key].profileStatus ?? 200,
    mediaStatus: details.mediaStatus ?? state.characters[key].mediaStatus ?? 200,
    reason: details.reason || "Média Blizzard disponible.",
  };

  state.characters[key] = entry;
  writeState(state);
  return entry;
}

function isDue(character, now = Date.now()) {
  const entry = state.characters[getKey(character)];
  return !entry || entry.status === "resolved" || Number(entry.nextCheckAt || 0) <= now;
}

function getEntry(character) {
  return state.characters[getKey(character)] || null;
}

function list() {
  return Object.values(state.characters).sort((a, b) => {
    const left = Number(a.nextCheckAt || a.resolvedAt || 0);
    const right = Number(b.nextCheckAt || b.resolvedAt || 0);
    return left - right;
  });
}

function reset(character) {
  const key = getKey(character);
  if (!state.characters[key]) return false;
  delete state.characters[key];
  writeState(state);
  return true;
}

module.exports = {
  getEntry,
  isDue,
  list,
  reset,
  resolve,
  schedule,
};
