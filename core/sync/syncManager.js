const { buildDashboardSummary } = require("../dashboard.service");
const { buildSessionJournal } = require("../journal.service");
const { buildRecentAchievements } = require("../achievements.service");
const { summarizeAchievements } = require("./achievementSync");
const { summarizeCollector } = require("./collectorSync");

function buildSyncResult({ characters = [], collector = {}, startedAt }) {
  const collectorCharacters = Array.isArray(collector.characters)
    ? collector.characters
    : [];
  const collectorAchievements = Array.isArray(collector.achievements)
    ? collector.achievements
    : [];
  const completedAt = Date.now();
  const mediaAvailable = characters.filter(
    (character) => character?.mediaStatus === "available",
  ).length;
  const mediaPending = characters.filter(
    (character) => character?.mediaStatus === "pending",
  ).length;
  const mediaErrors = characters.filter(
    (character) => character?.mediaStatus === "error",
  ).length;

  return {
    connected: true,
    count: characters.length,
    characters,
    dashboard: buildDashboardSummary(characters, collectorCharacters),
    journal: buildSessionJournal(collectorCharacters, 12),
    achievements: buildRecentAchievements(collectorAchievements, 3),
    sync: {
      version: "1.0.2",
      startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt - startedAt),
      battleNet: {
        available: true,
        characterCount: characters.length,
        mediaAvailable,
        mediaPending,
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
