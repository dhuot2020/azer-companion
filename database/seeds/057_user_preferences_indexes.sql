-- ============================================================
-- 057 - INDEX PREFERENCES / CHECKLISTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_checklist_definitions_version
    ON checklist_definitions(game_version_id);

CREATE INDEX IF NOT EXISTS idx_checklist_definitions_class
    ON checklist_definitions(class_id);

CREATE INDEX IF NOT EXISTS idx_user_checklists_character
    ON user_checklists(character_id);

CREATE INDEX IF NOT EXISTS idx_user_character_preferences_character
    ON user_character_preferences(character_id);
