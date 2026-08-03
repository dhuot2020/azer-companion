function summarizeCollector(collector = {}) {
  const characters = Array.isArray(collector.characters)
    ? collector.characters
    : [];
  const achievements = Array.isArray(collector.achievements)
    ? collector.achievements
    : [];

  return {
    available: collector.available === true,
    sourceUpdatedAt: Number(collector.sourceUpdatedAt) || null,
    dataUpdatedAt: Number(collector.dataUpdatedAt) || null,
    characterCount: characters.length,
    achievementCount: achievements.length,
    lastCharacterGuid: String(collector.lastCharacterGuid || ""),
  };
}

module.exports = {
  summarizeCollector,
};
