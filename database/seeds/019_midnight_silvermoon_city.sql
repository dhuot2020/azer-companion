-- ============================================================
-- 019 - MIDNIGHT
-- SILVERMOON CITY - HUB PRINCIPAL
-- ============================================================

INSERT INTO wow_zones (zone_key, zone_name, zone_type)
VALUES
    ('silvermoon-city-midnight', 'Lune-d’Argent', 'city')
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
    is_available,
    is_current_version,
    metadata
)
SELECT
    gv.id,
    z.id,
    e.id,
    z.zone_name,
    wr.id,
    TRUE,
    TRUE,
    jsonb_build_object(
        'campaign_hub', TRUE,
        'access', 'both-factions-with-restricted-horde-area'
    )
FROM wow_game_versions gv
JOIN wow_expansions e
    ON e.expansion_key = 'midnight'
JOIN wow_zones z
    ON z.zone_key = 'silvermoon-city-midnight'
JOIN wow_world_regions wr
    ON wr.region_key = 'eastern-kingdoms'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, zone_id) DO UPDATE
SET
    expansion_id = EXCLUDED.expansion_id,
    version_zone_name = EXCLUDED.version_zone_name,
    world_region_id = EXCLUDED.world_region_id,
    is_available = TRUE,
    is_current_version = TRUE,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
