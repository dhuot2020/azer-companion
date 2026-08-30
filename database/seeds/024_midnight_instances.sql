INSERT INTO instance_definitions (
    instance_key, instance_name, instance_type, expansion_key
)
VALUES
    ('windrunner-spire', 'Windrunner Spire', 'dungeon', 'midnight'),
    ('magisters-terrace-midnight', 'Magister''s Terrace', 'dungeon', 'midnight'),
    ('murder-row', 'Murder Row', 'dungeon', 'midnight'),
    ('den-of-nalorakk', 'Den of Nalorakk', 'dungeon', 'midnight'),
    ('maisara-caverns', 'Maisara Caverns', 'dungeon', 'midnight'),
    ('blinding-vale', 'Blinding Vale', 'dungeon', 'midnight'),
    ('nexus-point-xenas', 'Nexus-Point Xenas', 'dungeon', 'midnight'),
    ('voidscar-arena', 'Voidscar Arena', 'dungeon', 'midnight'),
    ('the-voidspire', 'The Voidspire', 'raid', 'midnight'),
    ('the-dreamrift', 'The Dreamrift', 'raid', 'midnight'),
    ('march-on-queldanas', 'March on Quel''Danas', 'raid', 'midnight')
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
JOIN wow_expansions e ON e.expansion_key = 'midnight'
JOIN instance_definitions i ON i.instance_key IN (
        'windrunner-spire',
        'magisters-terrace-midnight',
        'murder-row',
        'den-of-nalorakk',
        'maisara-caverns',
        'blinding-vale',
        'nexus-point-xenas',
        'voidscar-arena',
        'the-voidspire',
        'the-dreamrift',
        'march-on-queldanas'
)
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, instance_id) DO UPDATE
SET expansion_id = EXCLUDED.expansion_id,
    version_instance_name = EXCLUDED.version_instance_name,
    is_available = TRUE,
    is_current_content = TRUE,
    updated_at = NOW();
