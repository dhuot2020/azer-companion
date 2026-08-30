-- ============================================================
-- RACES DISPONIBLES PAR VERSION DE WORLD OF WARCRAFT
-- ============================================================

-- ------------------------------------------------------------
-- RETAIL - MIDNIGHT
-- Toutes les races de notre catalogue Retail actuel
-- ------------------------------------------------------------

INSERT INTO wow_game_version_races (
    game_version_id,
    race_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    TRUE
FROM wow_game_versions gv
CROSS JOIN wow_races r
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ------------------------------------------------------------
-- CLASSIC ERA
-- Races originales
-- ------------------------------------------------------------

INSERT INTO wow_game_version_races (
    game_version_id,
    race_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'orc',
        'undead',
        'tauren',
        'troll'
    )
WHERE gv.game_key = 'classic-era'
ON CONFLICT (game_version_id, race_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ------------------------------------------------------------
-- CLASSIC HARDCORE
-- Même base de races que Classic Era
-- ------------------------------------------------------------

INSERT INTO wow_game_version_races (
    game_version_id,
    race_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'orc',
        'undead',
        'tauren',
        'troll'
    )
WHERE gv.game_key = 'classic-hardcore'
ON CONFLICT (game_version_id, race_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ------------------------------------------------------------
-- CLASSIC SEASON OF DISCOVERY
-- Base Vanilla
-- ------------------------------------------------------------

INSERT INTO wow_game_version_races (
    game_version_id,
    race_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'orc',
        'undead',
        'tauren',
        'troll'
    )
WHERE gv.game_key = 'classic-season-of-discovery'
ON CONFLICT (game_version_id, race_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ------------------------------------------------------------
-- BURNING CRUSADE CLASSIC ANNIVERSARY
-- Vanilla + Draenei + Blood Elf
-- ------------------------------------------------------------

INSERT INTO wow_game_version_races (
    game_version_id,
    race_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'draenei',
        'orc',
        'undead',
        'tauren',
        'troll',
        'blood-elf'
    )
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, race_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ------------------------------------------------------------
-- MISTS OF PANDARIA CLASSIC
-- Cataclysm races + Pandaren
-- ------------------------------------------------------------

INSERT INTO wow_game_version_races (
    game_version_id,
    race_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'draenei',
        'worgen',
        'orc',
        'undead',
        'tauren',
        'troll',
        'blood-elf',
        'goblin',
        'pandaren'
    )
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, race_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;