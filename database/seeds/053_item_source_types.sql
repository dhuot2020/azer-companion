-- ============================================================
-- 053 - TYPES DE SOURCES D'ITEMS
-- ============================================================

INSERT INTO item_source_type_definitions (
    source_key,
    source_name,
    sort_order
)
VALUES
    ('drop', 'Butin', 10),
    ('boss', 'Boss', 20),
    ('quest', 'Quête', 30),
    ('vendor', 'Marchand', 40),
    ('reputation', 'Réputation', 50),
    ('profession', 'Profession', 60),
    ('world-event', 'Évènement mondial', 70),
    ('great-vault', 'Grande chambre forte', 80),
    ('delve', 'Gouffre', 90),
    ('currency', 'Monnaie', 100),
    ('crafted-order', 'Commande d’artisanat', 110),
    ('other', 'Autre', 999)
ON CONFLICT (source_key) DO UPDATE
SET
    source_name = EXCLUDED.source_name,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
