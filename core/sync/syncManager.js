const { buildDashboardSummary } = require("../dashboard.service");
const { buildSessionJournal } = require("../journal.service");
const { buildRecentAchievements } = require("../achievements.service");
const { summarizeAchievements } = require("./achievementSync");
const { summarizeCollector } = require("./collectorSync");
const { ASE_VERSION, getStatus } = require("../ase");
const characterEngine = require("../engine/character/register");

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
    characters: normalizedCharacters,
    dashboard: buildDashboardSummary(normalizedCharacters, collectorCharacters),
    journal: buildSessionJournal(collectorCharacters, 12),
    achievements: buildRecentAchievements(collectorAchievements, 3),
    ase: {
      ...getStatus(),
      character: characterResult.summary,
    },
    sync: {
      version: `2.0.1-ase-${ASE_VERSION}`,
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
