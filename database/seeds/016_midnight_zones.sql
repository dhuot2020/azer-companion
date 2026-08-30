-- ============================================================
-- 016 - ZONES PRINCIPALES RETAIL / MIDNIGHT
-- Catalogue initial extensible
-- ============================================================

INSERT INTO wow_zones (zone_key, zone_name, zone_type)
VALUES
    ('eversong-woods', 'Bois des Chants éternels', 'zone'),
    ('zul-aman', 'Zul’Aman', 'zone'),
    ('harandar', 'Harandar', 'zone'),
    ('voidstorm', 'Tempête du Vide', 'zone')
ON CONFLICT (zone_key) DO UPDATE
SET zone_name = EXCLUDED.zone_name,
    zone_type = EXCLUDED.zone_type,
    updated_at = NOW();

INSERT INTO wow_game_version_zones
(game_version_id, zone_id, expansion_id, version_zone_name,
 world_region_id, is_available, is_current_version)
SELECT
    gv.id,
    z.id,
    e.id,
    z.zone_name,
    wr.id,
    TRUE,
    TRUE
FROM wow_game_versions gv
JOIN wow_expansions e ON e.expansion_key = 'midnight'
JOIN wow_zones z ON z.zone_key IN (
    'eversong-woods','zul-aman','harandar','voidstorm'
)
LEFT JOIN wow_world_regions wr
    ON wr.region_key = CASE
        WHEN z.zone_key IN ('eversong-woods','zul-aman') THEN 'eastern-kingdoms'
        ELSE 'azeroth'
    END
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, zone_id) DO UPDATE
SET expansion_id = EXCLUDED.expansion_id,
    version_zone_name = EXCLUDED.version_zone_name,
    world_region_id = EXCLUDED.world_region_id,
    is_available = TRUE,
    is_current_version = TRUE,
    updated_at = NOW();
