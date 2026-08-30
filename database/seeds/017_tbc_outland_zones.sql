-- ============================================================
-- 017 - THE BURNING CRUSADE CLASSIC ANNIVERSARY
-- ZONES PRINCIPALES D'OUTRETERRE
-- ============================================================

INSERT INTO wow_zones (zone_key, zone_name, zone_type)
VALUES
    ('hellfire-peninsula', 'Péninsule des Flammes infernales', 'zone'),
    ('zangarmarsh', 'Marécage de Zangar', 'zone'),
    ('terokkar-forest', 'Forêt de Terokkar', 'zone'),
    ('nagrand-outland', 'Nagrand', 'zone'),
    ('blades-edge-mountains', 'Les Tranchantes', 'zone'),
    ('netherstorm', 'Raz-de-Néant', 'zone'),
    ('shadowmoon-valley-outland', 'Vallée d’Ombrelune', 'zone')
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
        WHEN 'hellfire-peninsula' THEN 58
        WHEN 'zangarmarsh' THEN 60
        WHEN 'terokkar-forest' THEN 62
        WHEN 'nagrand-outland' THEN 64
        WHEN 'blades-edge-mountains' THEN 65
        WHEN 'netherstorm' THEN 67
        WHEN 'shadowmoon-valley-outland' THEN 67
    END,
    CASE z.zone_key
        WHEN 'hellfire-peninsula' THEN 63
        WHEN 'zangarmarsh' THEN 64
        WHEN 'terokkar-forest' THEN 65
        WHEN 'nagrand-outland' THEN 67
        WHEN 'blades-edge-mountains' THEN 68
        WHEN 'netherstorm' THEN 70
        WHEN 'shadowmoon-valley-outland' THEN 70
    END,
    TRUE,
    TRUE
FROM wow_game_versions gv
JOIN wow_expansions e
    ON e.expansion_key = 'the-burning-crusade'
JOIN wow_zones z
    ON z.zone_key IN (
        'hellfire-peninsula',
        'zangarmarsh',
        'terokkar-forest',
        'nagrand-outland',
        'blades-edge-mountains',
        'netherstorm',
        'shadowmoon-valley-outland'
    )
JOIN wow_world_regions wr
    ON wr.region_key = 'outland'
WHERE gv.game_key = 'classic-anniversary-tbc'
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
