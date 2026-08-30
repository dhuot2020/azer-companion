INSERT INTO wow_game_version_instance_difficulties (
    game_version_id, instance_id, difficulty_id, is_available
)
SELECT gv.id, i.id, d.id, TRUE
FROM wow_game_versions gv
JOIN wow_game_version_instances gvi
    ON gvi.game_version_id = gv.id
JOIN instance_definitions i
    ON i.id = gvi.instance_id
JOIN wow_difficulty_definitions d
    ON d.difficulty_key = 'legacy-raid'
WHERE gv.game_key = 'classic-anniversary-tbc'
  AND i.instance_type = 'raid'
ON CONFLICT (game_version_id, instance_id, difficulty_id) DO UPDATE
SET is_available = TRUE, updated_at = NOW();
