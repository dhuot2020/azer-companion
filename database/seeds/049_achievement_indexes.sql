-- ============================================================
-- 049 - INDEX POUR LES HAUTS FAITS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_character_achievements_completed
    ON character_achievements(character_id, completed);

CREATE INDEX IF NOT EXISTS idx_character_achievements_achievement
    ON character_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS idx_account_achievements_completed
    ON account_achievements(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_wow_game_version_achievements_available
    ON wow_game_version_achievements(game_version_id, is_available);
