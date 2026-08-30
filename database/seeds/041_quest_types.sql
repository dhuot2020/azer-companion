-- ============================================================
-- 041 - TYPES DE QUETES
-- ============================================================

INSERT INTO quest_type_definitions (
    quest_type_key,
    quest_type_name,
    sort_order
)
VALUES
    ('standard', 'Quête', 10),
    ('campaign', 'Campagne', 20),
    ('class', 'Quête de classe', 30),
    ('profession', 'Quête de profession', 40),
    ('world', 'Quête mondiale', 50),
    ('daily', 'Quête journalière', 60),
    ('weekly', 'Quête hebdomadaire', 70),
    ('dungeon', 'Quête de donjon', 80),
    ('raid', 'Quête de raid', 90),
    ('scenario', 'Quête de scénario', 100),
    ('event', 'Quête d’évènement', 110),
    ('breadcrumb', 'Quête d’introduction', 120),
    ('other', 'Autre', 999)
ON CONFLICT (quest_type_key) DO UPDATE
SET
    quest_type_name = EXCLUDED.quest_type_name,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
