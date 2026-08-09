const { buildDashboardSummary } = require("../dashboard.service");
const { buildSessionJournal } = require("../journal.service");
const { buildRecentAchievements } = require("../achievements.service");
const { summarizeAchievements } = require("./achievementSync");
const { summarizeCollector } = require("./collectorSync");
const { ASE_VERSION, getStatus } = require("../ase");
const characterEngine = require("../engine/character/register");
const eventEngine = require("../engine/event/register");
const heroEngine = require("../engine/hero/register");

function buildSyncResult({ characters = [], collector = {}, startedAt }) {
  const collectorCharacters = Array.isArray(collector.characters)
    ? collector.characters
    : [];
  const collectorAchievements = Array.isArray(collector.achievements)
    ? collector.achievements
    : [];

  const characterResult = characterEngine.buildCharacters({
    characters,
    collectorCharacters,
  });
  const normalizedCharacters = characterResult.characters;
  const heroResult = heroEngine.buildHeroes(normalizedCharacters);
  const sessionJournal = buildSessionJournal(collectorCharacters, 100);
  const eventResult = eventEngine.buildEvents({
    characters: normalizedCharacters,
    collectorCharacters,
    achievements: collectorAchievements,
    journal: sessionJournal,
  });
  const completedAt = Date.now();
  const mediaAvailable = normalizedCharacters.filter(
    (character) => character?.mediaStatus === "available",
  ).length;
  const mediaPending = normalizedCharacters.filter(
    (character) => character?.mediaStatus === "pending",
  ).length;
  const mediaErrors = normalizedCharacters.filter(
    (character) => character?.mediaStatus === "error",
  ).length;
  const mediaWaiting = normalizedCharacters.filter(
    (character) => character?.mediaStatus === "waiting",
  ).length;

  return {
    connected: true,
    count: normalizedCharacters.length,
    characters: normalizedCharacters.map((character, index) => ({
      ...character,
      hero: heroResult.heroes[index],
    })),
    heroes: heroResult.heroes,
    dashboard: buildDashboardSummary(normalizedCharacters, collectorCharacters),
    journal: eventResult.events.slice(0, 20),
    sessionJournal: sessionJournal.slice(0, 20),
    achievements: buildRecentAchievements(collectorAchievements, 3),
    ase: {
      ...getStatus(),
      character: characterResult.summary,
      event: eventResult.summary,
      hero: heroResult.summary,
    },
    sync: {
      version: `3.0.0-alpha2-ase-${ASE_VERSION}`,
      startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt - startedAt),
      battleNet: {
        available: true,
        characterCount: normalizedCharacters.length,
        mediaAvailable,
        mediaPending,
        mediaWaiting,
        mediaErrors,
      },
      collector: summarizeCollector(collector),
      achievements: summarizeAchievements(collectorAchievements),
    },
  };
}

module.exports = {
  buildSyncResult,
};
