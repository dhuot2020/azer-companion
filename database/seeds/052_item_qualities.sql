-- ============================================================
-- 052 - QUALITES D'ITEMS
-- ============================================================

INSERT INTO item_quality_definitions (
    quality_key,
    quality_name,
    quality_order
)
VALUES
    ('poor', 'Médiocre', 0),
    ('common', 'Commun', 1),
    ('uncommon', 'Inhabituel', 2),
    ('rare', 'Rare', 3),
    ('epic', 'Épique', 4),
    ('legendary', 'Légendaire', 5),
    ('artifact', 'Artéfact', 6),
    ('heirloom', 'Héritage', 7),
    ('wow-token', 'Jeton WoW', 8)
ON CONFLICT (quality_key) DO UPDATE
SET
    quality_name = EXCLUDED.quality_name,
    quality_order = EXCLUDED.quality_order,
    updated_at = NOW();
