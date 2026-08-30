-- ============================================================
-- 048 - CATEGORIES DE HAUTS FAITS
-- ============================================================

INSERT INTO achievement_category_definitions (
    category_key,
    category_name,
    sort_order
)
VALUES
    ('general', 'Général', 10),
    ('quests', 'Quêtes', 20),
    ('exploration', 'Exploration', 30),
    ('player-vs-player', 'Joueur contre joueur', 40),
    ('dungeons-raids', 'Donjons et raids', 50),
    ('professions', 'Professions', 60),
    ('reputation', 'Réputation', 70),
    ('world-events', 'Évènements mondiaux', 80),
    ('pet-battles', 'Combats de mascottes', 90),
    ('collections', 'Collections', 100),
    ('feats-of-strength', 'Tours de force', 110),
    ('legacy', 'Héritage', 120)
ON CONFLICT (category_key) DO UPDATE
SET
    category_name = EXCLUDED.category_name,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
