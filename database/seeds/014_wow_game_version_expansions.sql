-- ============================================================
-- 014 - EXTENSIONS DISPONIBLES PAR VERSION DE WOW
-- ============================================================

INSERT INTO wow_game_version_expansions
(game_version_id, expansion_id, is_current_expansion, is_available)
SELECT gv.id, e.id, (e.expansion_key = 'midnight'), TRUE
FROM wow_game_versions gv
CROSS JOIN wow_expansions e
WHERE gv.game_key = 'retail-midnight'
  AND e.release_order <= 11
ON CONFLICT (game_version_id, expansion_id) DO UPDATE
SET is_current_expansion = EXCLUDED.is_current_expansion,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

INSERT INTO wow_game_version_expansions
(game_version_id, expansion_id, is_current_expansion, is_available)
SELECT gv.id, e.id, TRUE, TRUE
FROM wow_game_versions gv
JOIN wow_expansions e ON e.expansion_key = 'classic'
WHERE gv.game_key IN ('classic-era','classic-hardcore','classic-season-of-discovery')
ON CONFLICT (game_version_id, expansion_id) DO UPDATE
SET is_current_expansion = TRUE,
    is_available = TRUE,
    updated_at = NOW();

INSERT INTO wow_game_version_expansions
(game_version_id, expansion_id, is_current_expansion, is_available)
SELECT gv.id, e.id, (e.expansion_key = 'the-burning-crusade'), TRUE
FROM wow_game_versions gv
JOIN wow_expansions e
  ON e.expansion_key IN ('classic','the-burning-crusade')
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, expansion_id) DO UPDATE
SET is_current_expansion = EXCLUDED.is_current_expansion,
    is_available = TRUE,
    updated_at = NOW();

INSERT INTO wow_game_version_expansions
(game_version_id, expansion_id, is_current_expansion, is_available)
SELECT gv.id, e.id, (e.expansion_key = 'mists-of-pandaria'), TRUE
FROM wow_game_versions gv
JOIN wow_expansions e
  ON e.expansion_key IN (
    'classic','the-burning-crusade','wrath-of-the-lich-king',
    'cataclysm','mists-of-pandaria'
  )
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, expansion_id) DO UPDATE
SET is_current_expansion = EXCLUDED.is_current_expansion,
    is_available = TRUE,
    updated_at = NOW();
