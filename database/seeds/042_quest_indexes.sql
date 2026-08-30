-- ============================================================
-- 042 - INDEX DE RECHERCHE POUR LE CARNET DE QUETES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_quest_definitions_type_id
    ON quest_definitions(quest_type_id);

CREATE INDEX IF NOT EXISTS idx_quest_definitions_class_important
    ON quest_definitions(class_id, is_important);

CREATE INDEX IF NOT EXISTS idx_quest_definitions_expansion
    ON quest_definitions(expansion_key);

CREATE INDEX IF NOT EXISTS idx_character_quests_completed
    ON character_quests(character_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_account_quest_completions_quest
    ON account_quest_completions(quest_id);
