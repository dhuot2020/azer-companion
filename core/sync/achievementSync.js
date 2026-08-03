function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function summarizeAchievements(achievements = []) {
  const normalized = (Array.isArray(achievements) ? achievements : [])
    .filter((achievement) => achievement && achievement.id)
    .map((achievement) => ({
      id: toFiniteNumber(achievement.id),
      name: String(achievement.name || "Haut fait obtenu"),
      points: toFiniteNumber(achievement.points),
      completed: achievement.completed === true,
      earnedAt: toFiniteNumber(
        achievement.completedAt ||
          achievement.observedEarnedAt ||
          achievement.earnedAt,
      ),
      characterName: String(
        achievement.characterName || achievement.earnedBy || "",
      ),
      characterRealm: String(achievement.characterRealm || ""),
      wasEarnedByMe: achievement.wasEarnedByMe === true,
    }))
    .filter((achievement) => achievement.completed)
    .sort((first, second) => second.earnedAt - first.earnedAt);

  return {
    count: normalized.length,
    totalPoints: normalized.reduce(
      (total, achievement) => total + achievement.points,
      0,
    ),
    latestEarnedAt: normalized[0]?.earnedAt || null,
    latest: normalized.slice(0, 10),
  };
}

module.exports = {
  summarizeAchievements,
};
