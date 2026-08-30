-- ============================================================
-- 018 - MISTS OF PANDARIA CLASSIC
-- ZONES PRINCIPALES DE PANDARIE
-- ============================================================

INSERT INTO wow_zones (zone_key, zone_name, zone_type)
VALUES
    ('wandering-isle', 'Île Vagabonde', 'zone'),
    ('jade-forest', 'Forêt de Jade', 'zone'),
    ('valley-of-the-four-winds', 'Vallée des Quatre vents', 'zone'),
    ('krasarang-wilds', 'Étendues sauvages de Krasarang', 'zone'),
    ('kun-lai-summit', 'Sommet de Kun-Lai', 'zone'),
    ('townlong-steppes', 'Steppes de Tanglong', 'zone'),
    ('dread-wastes', 'Terres de l’Angoisse', 'zone'),
    ('vale-of-eternal-blossoms', 'Val de l’Éternel printemps', 'zone')
ON CONFLICT (zone_key) DO UPDATE
SET
    zone_name = EXCLUDED.zone_name,
    zone_type = EXCLUDED.zone_type,
    updated_at = NOW();

INSERT INTO wow_game_version_zones (
    game_version_id,
    zone_id,
    expansion_id,
    version_zone_name,
    world_region_id,
    minimum_level,
    maximum_level,
    is_available,
    is_current_version
)
SELECT
    gv.id,
    z.id,
    e.id,
    z.zone_name,
    wr.id,
    CASE z.zone_key
        WHEN 'wandering-isle' THEN 1
        WHEN 'jade-forest' THEN 85
        WHEN 'valley-of-the-four-winds' THEN 86
        WHEN 'krasarang-wilds' THEN 86
        WHEN 'kun-lai-summit' THEN 87
        WHEN 'townlong-steppes' THEN 88
        WHEN 'dread-wastes' THEN 89
        WHEN 'vale-of-eternal-blossoms' THEN 90
    END,
    CASE z.zone_key
        WHEN 'wandering-isle' THEN 10
        WHEN 'jade-forest' THEN 86
        WHEN 'valley-of-the-four-winds' THEN 87
        WHEN 'krasarang-wilds' THEN 87
        WHEN 'kun-lai-summit' THEN 88
        WHEN 'townlong-steppes' THEN 89
        WHEN 'dread-wastes' THEN 90
        WHEN 'vale-of-eternal-blossoms' THEN 90
    END,
    TRUE,
    TRUE
FROM wow_game_versions gv
JOIN wow_expansions e
    ON e.expansion_key = 'mists-of-pandaria'
JOIN wow_zones z
    ON z.zone_key IN (
        'wandering-isle',
        'jade-forest',
        'valley-of-the-four-winds',
        'krasarang-wilds',
        'kun-lai-summit',
        'townlong-steppes',
        'dread-wastes',
        'vale-of-eternal-blossoms'
    )
LEFT JOIN wow_world_regions wr
    ON wr.region_key = CASE
        WHEN z.zone_key = 'wandering-isle' THEN 'azeroth'
        ELSE 'pandaria'
    END
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, zone_id) DO UPDATE
SET
    expansion_id = EXCLUDED.expansion_id,
    version_zone_name = EXCLUDED.version_zone_name,
    world_region_id = EXCLUDED.world_region_id,
    minimum_level = EXCLUDED.minimum_level,
    maximum_level = EXCLUDED.maximum_level,
    is_available = TRUE,
    is_current_version = TRUE,
    updated_at = NOW();
