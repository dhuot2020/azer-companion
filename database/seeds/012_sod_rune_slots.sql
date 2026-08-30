-- ============================================================
-- 012 - SEASON OF DISCOVERY : EMPLACEMENTS DE RUNES
-- ============================================================

INSERT INTO sod_rune_slots (
    slot_key,
    slot_name,
    sort_order,
    is_active
)
VALUES
    ('chest',    'Torse',      10, TRUE),
    ('legs',     'Jambes',     20, TRUE),
    ('gloves',   'Gants',      30, TRUE),
    ('belt',     'Ceinture',    40, TRUE),
    ('boots',    'Bottes',      50, TRUE),
    ('helm',     'Heaume',      60, TRUE),
    ('bracers',  'Brassards',   70, TRUE),
    ('cloak',    'Cape',        80, TRUE),

    -- SoD Phase 4 a ajouté des runes utilitaires
    -- sur les emplacements d'anneaux.
    ('ring-1',   'Anneau 1',    90, TRUE),
    ('ring-2',   'Anneau 2',   100, TRUE)

ON CONFLICT (slot_key) DO UPDATE
SET
    slot_name = EXCLUDED.slot_name,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();