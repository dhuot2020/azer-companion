-- ============================================================
-- 020 - CLASSIC ERA
-- Zones principales Vanilla
-- ============================================================

INSERT INTO wow_zones (zone_key, zone_name, zone_type)
VALUES
    ('elwynn-forest', 'Forêt d’Elwynn', 'zone'),
    ('westfall', 'Marche de l’Ouest', 'zone'),
    ('duskwood', 'Bois de la Pénombre', 'zone'),
    ('redridge-mountains', 'Les Carmines', 'zone'),
    ('dun-morogh', 'Dun Morogh', 'zone'),
    ('loch-modan', 'Loch Modan', 'zone'),
    ('wetlands', 'Les Paluns', 'zone'),
    ('tirisfal-glades', 'Clairières de Tirisfal', 'zone'),
    ('silverpine-forest', 'Forêt des Pins-Argentés', 'zone'),
    ('hillsbrad-foothills', 'Contreforts de Hautebrande', 'zone'),
    ('arathi-highlands', 'Hautes-terres Arathies', 'zone'),
    ('alterac-mountains', 'Montagnes d’Alterac', 'zone'),
    ('the-hinterlands', 'Les Hinterlands', 'zone'),
    ('western-plaguelands', 'Maleterres de l’Ouest', 'zone'),
    ('eastern-plaguelands', 'Maleterres de l’Est', 'zone'),
    ('badlands', 'Terres ingrates', 'zone'),
    ('searing-gorge', 'Gorge des Vents brûlants', 'zone'),
    ('burning-steppes', 'Steppes ardentes', 'zone'),
    ('swamp-of-sorrows', 'Marais des Chagrins', 'zone'),
    ('blasted-lands', 'Terres foudroyées', 'zone'),
    ('stranglethorn-vale', 'Vallée de Strangleronce', 'zone'),
    ('deadwind-pass', 'Défilé de Deuillevent', 'zone'),
    ('durotar', 'Durotar', 'zone'),
    ('mulgore', 'Mulgore', 'zone'),
    ('teldrassil', 'Teldrassil', 'zone'),
    ('darkshore', 'Sombrivage', 'zone'),
    ('the-barrens', 'Les Tarides', 'zone'),
    ('stonetalon-mountains', 'Les Serres-Rocheuses', 'zone'),
    ('ashenvale', 'Orneval', 'zone'),
    ('thousand-needles', 'Mille pointes', 'zone'),
    ('desolace', 'Désolace', 'zone'),
    ('dustwallow-marsh', 'Marécage d’Âprefange', 'zone'),
    ('feralas', 'Féralas', 'zone'),
    ('tanaris', 'Tanaris', 'zone'),
    ('azshara', 'Azshara', 'zone'),
    ('felwood', 'Gangrebois', 'zone'),
    ('ungoro-crater', 'Cratère d’Un’Goro', 'zone'),
    ('silithus', 'Silithus', 'zone'),
    ('winterspring', 'Berceau-de-l’Hiver', 'zone'),
    ('moonglade', 'Reflet-de-Lune', 'zone')
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
    ON z.zone_key IN (
        'elwynn-forest',
        'westfall',
        'duskwood',
        'redridge-mountains',
        'dun-morogh',
        'loch-modan',
        'wetlands',
        'tirisfal-glades',
        'silverpine-forest',
        'hillsbrad-foothills',
        'arathi-highlands',
        'alterac-mountains',
        'the-hinterlands',
        'western-plaguelands',
        'eastern-plaguelands',
        'badlands',
        'searing-gorge',
        'burning-steppes',
        'swamp-of-sorrows',
        'blasted-lands',
        'stranglethorn-vale',
        'deadwind-pass',
        'durotar',
        'mulgore',
        'teldrassil',
        'darkshore',
        'the-barrens',
        'stonetalon-mountains',
        'ashenvale',
        'thousand-needles',
        'desolace',
        'dustwallow-marsh',
        'feralas',
        'tanaris',
        'azshara',
        'felwood',
        'ungoro-crater',
        'silithus',
        'winterspring',
        'moonglade'
    )
JOIN wow_world_regions wr
    ON wr.region_key = CASE z.zone_key
        WHEN 'elwynn-forest' THEN 'eastern-kingdoms'
        WHEN 'westfall' THEN 'eastern-kingdoms'
        WHEN 'duskwood' THEN 'eastern-kingdoms'
        WHEN 'redridge-mountains' THEN 'eastern-kingdoms'
        WHEN 'dun-morogh' THEN 'eastern-kingdoms'
        WHEN 'loch-modan' THEN 'eastern-kingdoms'
        WHEN 'wetlands' THEN 'eastern-kingdoms'
        WHEN 'tirisfal-glades' THEN 'eastern-kingdoms'
        WHEN 'silverpine-forest' THEN 'eastern-kingdoms'
        WHEN 'hillsbrad-foothills' THEN 'eastern-kingdoms'
        WHEN 'arathi-highlands' THEN 'eastern-kingdoms'
        WHEN 'alterac-mountains' THEN 'eastern-kingdoms'
        WHEN 'the-hinterlands' THEN 'eastern-kingdoms'
        WHEN 'western-plaguelands' THEN 'eastern-kingdoms'
        WHEN 'eastern-plaguelands' THEN 'eastern-kingdoms'
        WHEN 'badlands' THEN 'eastern-kingdoms'
        WHEN 'searing-gorge' THEN 'eastern-kingdoms'
        WHEN 'burning-steppes' THEN 'eastern-kingdoms'
        WHEN 'swamp-of-sorrows' THEN 'eastern-kingdoms'
        WHEN 'blasted-lands' THEN 'eastern-kingdoms'
        WHEN 'stranglethorn-vale' THEN 'eastern-kingdoms'
        WHEN 'deadwind-pass' THEN 'eastern-kingdoms'
        WHEN 'durotar' THEN 'kalimdor'
        WHEN 'mulgore' THEN 'kalimdor'
        WHEN 'teldrassil' THEN 'kalimdor'
        WHEN 'darkshore' THEN 'kalimdor'
        WHEN 'the-barrens' THEN 'kalimdor'
        WHEN 'stonetalon-mountains' THEN 'kalimdor'
        WHEN 'ashenvale' THEN 'kalimdor'
        WHEN 'thousand-needles' THEN 'kalimdor'
        WHEN 'desolace' THEN 'kalimdor'
        WHEN 'dustwallow-marsh' THEN 'kalimdor'
        WHEN 'feralas' THEN 'kalimdor'
        WHEN 'tanaris' THEN 'kalimdor'
        WHEN 'azshara' THEN 'kalimdor'
        WHEN 'felwood' THEN 'kalimdor'
        WHEN 'ungoro-crater' THEN 'kalimdor'
        WHEN 'silithus' THEN 'kalimdor'
        WHEN 'winterspring' THEN 'kalimdor'
        WHEN 'moonglade' THEN 'kalimdor'
    END
WHERE gv.game_key = 'classic-era'
ON CONFLICT (game_version_id, zone_id) DO UPDATE
SET
    expansion_id = EXCLUDED.expansion_id,
    version_zone_name = EXCLUDED.version_zone_name,
    world_region_id = EXCLUDED.world_region_id,
    is_available = TRUE,
    is_current_version = TRUE,
    updated_at = NOW();
