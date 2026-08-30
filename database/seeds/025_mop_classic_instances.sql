INSERT INTO instance_definitions (
    instance_key, instance_name, instance_type, expansion_key
)
VALUES
    ('temple-of-the-jade-serpent', 'Temple of the Jade Serpent', 'dungeon', 'mists-of-pandaria'),
    ('stormstout-brewery', 'Stormstout Brewery', 'dungeon', 'mists-of-pandaria'),
    ('shado-pan-monastery', 'Shado-Pan Monastery', 'dungeon', 'mists-of-pandaria'),
    ('mogushan-palace', 'Mogu''shan Palace', 'dungeon', 'mists-of-pandaria'),
    ('siege-of-niuzao-temple', 'Siege of Niuzao Temple', 'dungeon', 'mists-of-pandaria'),
    ('gate-of-the-setting-sun', 'Gate of the Setting Sun', 'dungeon', 'mists-of-pandaria'),
    ('scholomance-mop', 'Scholomance', 'dungeon', 'mists-of-pandaria'),
    ('scarlet-monastery-mop', 'Scarlet Monastery', 'dungeon', 'mists-of-pandaria'),
    ('mogushan-vaults', 'Mogu''shan Vaults', 'raid', 'mists-of-pandaria'),
    ('heart-of-fear', 'Heart of Fear', 'raid', 'mists-of-pandaria'),
    ('terrace-of-endless-spring', 'Terrace of Endless Spring', 'raid', 'mists-of-pandaria')
ON CONFLICT (instance_key) DO UPDATE
SET instance_name = EXCLUDED.instance_name,
    instance_type = EXCLUDED.instance_type,
    expansion_key = EXCLUDED.expansion_key,
    updated_at = NOW();

INSERT INTO wow_game_version_instances (
    game_version_id, instance_id, expansion_id,
    version_instance_name, is_available, is_current_content
)
SELECT gv.id, i.id, e.id, i.instance_name, TRUE, TRUE
FROM wow_game_versions gv
JOIN wow_expansions e ON e.expansion_key = 'mists-of-pandaria'
JOIN instance_definitions i ON i.instance_key IN (
        'temple-of-the-jade-serpent',
        'stormstout-brewery',
        'shado-pan-monastery',
        'mogushan-palace',
        'siege-of-niuzao-temple',
        'gate-of-the-setting-sun',
        'scholomance-mop',
        'scarlet-monastery-mop',
        'mogushan-vaults',
        'heart-of-fear',
        'terrace-of-endless-spring'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, instance_id) DO UPDATE
SET expansion_id = EXCLUDED.expansion_id,
    version_instance_name = EXCLUDED.version_instance_name,
    is_available = TRUE,
    is_current_content = TRUE,
    updated_at = NOW();
