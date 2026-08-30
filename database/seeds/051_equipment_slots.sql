-- ============================================================
-- 051 - EMPLACEMENTS D'EQUIPEMENT
-- ============================================================

INSERT INTO equipment_slot_definitions (
    slot_key,
    slot_name,
    slot_group,
    sort_order
)
VALUES
    ('head', 'Tête', 'armor', 10),
    ('neck', 'Cou', 'armor', 20),
    ('shoulder', 'Épaules', 'armor', 30),
    ('back', 'Dos', 'armor', 40),
    ('chest', 'Torse', 'armor', 50),
    ('shirt', 'Chemise', 'cosmetic', 60),
    ('tabard', 'Tabard', 'cosmetic', 70),
    ('wrist', 'Poignets', 'armor', 80),
    ('hands', 'Mains', 'armor', 90),
    ('waist', 'Taille', 'armor', 100),
    ('legs', 'Jambes', 'armor', 110),
    ('feet', 'Pieds', 'armor', 120),
    ('finger-1', 'Anneau 1', 'jewelry', 130),
    ('finger-2', 'Anneau 2', 'jewelry', 140),
    ('trinket-1', 'Bijou 1', 'trinket', 150),
    ('trinket-2', 'Bijou 2', 'trinket', 160),
    ('main-hand', 'Main droite', 'weapon', 170),
    ('off-hand', 'Main gauche', 'weapon', 180)
ON CONFLICT (slot_key) DO UPDATE
SET
    slot_name = EXCLUDED.slot_name,
    slot_group = EXCLUDED.slot_group,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
