function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildRecentAchievements(achievements = [], limit = 3) {
  return (Array.isArray(achievements) ? achievements : [])
    .filter((achievement) => achievement && achievement.id)
    .map((achievement) => ({
      id: toNumber(achievement.id),
      name: String(achievement.name || "Haut fait obtenu"),
      description: String(achievement.description || ""),
      points: toNumber(achievement.points),
      earnedAt: toNumber(achievement.earnedAt),
      characterName: String(achievement.characterName || ""),
      characterRealm: String(achievement.characterRealm || ""),
    }))
    .sort((first, second) => second.earnedAt - first.earnedAt)
    .slice(0, Math.max(0, Number(limit) || 0));
}

module.exports = {
  buildRecentAchievements,
};
