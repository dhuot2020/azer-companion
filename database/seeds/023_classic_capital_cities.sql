-- ============================================================
-- 023 - CAPITALES CLASSIC
-- ============================================================

INSERT INTO wow_zones (zone_key, zone_name, zone_type)
VALUES
    ('stormwind-city', 'Hurlevent', 'city'),
    ('ironforge', 'Forgefer', 'city'),
    ('undercity', 'Fossoyeuse', 'city'),
    ('orgrimmar', 'Orgrimmar', 'city'),
    ('thunder-bluff', 'Les Pitons-du-Tonnerre', 'city'),
    ('darnassus', 'Darnassus', 'city')
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
    is_current_version
)
SELECT
    gv.id,
    z.id,
    e.id,
    z.zone_name,
    wr.id,
    TRUE,
    TRUE
FROM wow_game_versions gv
JOIN wow_expansions e
    ON e.expansion_key = 'classic'
JOIN wow_zones z
    ON z.zone_key IN ('stormwind-city', 'ironforge', 'undercity', 'orgrimmar', 'thunder-bluff', 'darnassus')
JOIN wow_world_regions wr
    ON wr.region_key = CASE z.zone_key
        WHEN 'stormwind-city' THEN 'eastern-kingdoms'
        WHEN 'ironforge' THEN 'eastern-kingdoms'
        WHEN 'undercity' THEN 'eastern-kingdoms'
        WHEN 'orgrimmar' THEN 'kalimdor'
        WHEN 'thunder-bluff' THEN 'kalimdor'
        WHEN 'darnassus' THEN 'kalimdor'
    END
WHERE gv.game_key IN (
    'classic-era',
    'classic-hardcore',
    'classic-season-of-discovery'
)
ON CONFLICT (game_version_id, zone_id) DO UPDATE
SET
    expansion_id = EXCLUDED.expansion_id,
    version_zone_name = EXCLUDED.version_zone_name,
    world_region_id = EXCLUDED.world_region_id,
    is_available = TRUE,
    is_current_version = TRUE,
    updated_at = NOW();
