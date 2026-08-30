INSERT INTO instance_definitions (
    instance_key, instance_name, instance_type, expansion_key
)
VALUES
    ('karazhan', 'Karazhan', 'raid', 'the-burning-crusade'),
    ('gruuls-lair', 'Gruul''s Lair', 'raid', 'the-burning-crusade'),
    ('magtheridons-lair', 'Magtheridon''s Lair', 'raid', 'the-burning-crusade')
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
JOIN wow_expansions e ON e.expansion_key = 'the-burning-crusade'
JOIN instance_definitions i ON i.instance_key IN (
        'karazhan',
        'gruuls-lair',
        'magtheridons-lair'
)
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, instance_id) DO UPDATE
SET expansion_id = EXCLUDED.expansion_id,
    version_instance_name = EXCLUDED.version_instance_name,
    is_available = TRUE,
    is_current_content = TRUE,
    updated_at = NOW();
