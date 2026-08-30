-- ============================================================
-- 055 - INDEX PROFIL / SYNCHRONISATION
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wow_characters_profile_sync
    ON wow_characters(last_profile_sync_at);

CREATE INDEX IF NOT EXISTS idx_wow_characters_media_sync
    ON wow_characters(last_media_sync_at);

CREATE INDEX IF NOT EXISTS idx_character_profile_snapshots_game_version
    ON character_profile_snapshots(game_version_id);

CREATE INDEX IF NOT EXISTS idx_character_media_type
    ON character_media(media_type);
