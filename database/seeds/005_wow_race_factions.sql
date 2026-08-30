-- ============================================================
-- FACTIONS DES RACES PAR VERSION DE WORLD OF WARCRAFT
-- ============================================================


-- ============================================================
-- RETAIL - MIDNIGHT
-- ============================================================

-- Alliance uniquement
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'alliance'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'draenei',
        'worgen',
        'void-elf',
        'lightforged',
        'dark-iron-dwarf',
        'kul-tiran',
        'mechagnome'
    )
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Horde uniquement
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'horde'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'orc',
        'undead',
        'tauren',
        'troll',
        'blood-elf',
        'goblin',
        'nightborne',
        'highmountain',
        'maghar-orc',
        'zandalari',
        'vulpera'
    )
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Les deux factions
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    f.faction
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'pandaren',
        'dracthyr',
        'earthen',
        'haranir'
    )
CROSS JOIN (
    VALUES
        ('alliance'),
        ('horde')
) AS f(faction)
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- ============================================================
-- CLASSIC ERA
-- ============================================================

-- Alliance
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'alliance'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome'
    )
WHERE gv.game_key = 'classic-era'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Horde
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'horde'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'orc',
        'undead',
        'tauren',
        'troll'
    )
WHERE gv.game_key = 'classic-era'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- ============================================================
-- CLASSIC HARDCORE
-- ============================================================

-- Alliance
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'alliance'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome'
    )
WHERE gv.game_key = 'classic-hardcore'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Horde
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'horde'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'orc',
        'undead',
        'tauren',
        'troll'
    )
WHERE gv.game_key = 'classic-hardcore'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- ============================================================
-- SEASON OF DISCOVERY
-- ============================================================

-- Alliance
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'alliance'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome'
    )
WHERE gv.game_key = 'classic-season-of-discovery'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Horde
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'horde'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'orc',
        'undead',
        'tauren',
        'troll'
    )
WHERE gv.game_key = 'classic-season-of-discovery'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- ============================================================
-- THE BURNING CRUSADE CLASSIC ANNIVERSARY
-- ============================================================

-- Alliance
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'alliance'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'draenei'
    )
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Horde
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'horde'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'orc',
        'undead',
        'tauren',
        'troll',
        'blood-elf'
    )
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- ============================================================
-- MISTS OF PANDARIA CLASSIC
-- ============================================================

-- Alliance
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'alliance'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'night-elf',
        'gnome',
        'draenei',
        'worgen'
    )
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Horde
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    'horde'
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'orc',
        'undead',
        'tauren',
        'troll',
        'blood-elf',
        'goblin'
    )
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;


-- Pandaren : Alliance OU Horde
INSERT INTO wow_race_factions (
    game_version_id,
    race_id,
    faction
)
SELECT
    gv.id,
    r.id,
    f.faction
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key = 'pandaren'
CROSS JOIN (
    VALUES
        ('alliance'),
        ('horde')
) AS f(faction)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, race_id, faction) DO NOTHING;