-- ============================================================
-- COMBINAISONS RACE / CLASSE
-- CLASSIC ERA / HARDCORE / SOD / TBC / MOP
-- ============================================================

-- ============================================================
-- CLASSIC ERA
-- ============================================================

-- HUMAN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'human'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','rogue','priest','mage','warlock'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- DWARF
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'dwarf'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','rogue','priest'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- NIGHT ELF
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'night-elf'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest','druid'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- GNOME
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'gnome'
JOIN wow_classes c ON c.class_key IN (
    'warrior','rogue','mage','warlock'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- ORC
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'orc'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','shaman','warlock'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- UNDEAD
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'undead'
JOIN wow_classes c ON c.class_key IN (
    'warrior','rogue','priest','mage','warlock'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- TAUREN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'tauren'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','shaman','druid'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- TROLL
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'troll'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest','shaman','mage'
)
WHERE gv.game_key = 'classic-era'
ON CONFLICT DO NOTHING;


-- ============================================================
-- HARDCORE = mêmes combinaisons que Classic Era
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT
    hardcore.id,
    wrc.race_id,
    wrc.class_id,
    TRUE
FROM wow_race_classes wrc
JOIN wow_game_versions era
    ON era.id = wrc.game_version_id
JOIN wow_game_versions hardcore
    ON hardcore.game_key = 'classic-hardcore'
WHERE era.game_key = 'classic-era'
ON CONFLICT DO NOTHING;


-- ============================================================
-- SEASON OF DISCOVERY
-- Même base de combinaisons race/classe que Classic Era
-- Les runes changent les rôles, pas les classes disponibles.
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT
    sod.id,
    wrc.race_id,
    wrc.class_id,
    TRUE
FROM wow_race_classes wrc
JOIN wow_game_versions era
    ON era.id = wrc.game_version_id
JOIN wow_game_versions sod
    ON sod.game_key = 'classic-season-of-discovery'
WHERE era.game_key = 'classic-era'
ON CONFLICT DO NOTHING;


-- ============================================================
-- BURNING CRUSADE CLASSIC ANNIVERSARY
-- ============================================================

-- Copier les combinaisons Vanilla
INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT
    tbc.id,
    wrc.race_id,
    wrc.class_id,
    TRUE
FROM wow_race_classes wrc
JOIN wow_game_versions era
    ON era.id = wrc.game_version_id
JOIN wow_game_versions tbc
    ON tbc.game_key = 'classic-anniversary-tbc'
WHERE era.game_key = 'classic-era'
ON CONFLICT DO NOTHING;

-- Draenei
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'draenei'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','priest','shaman','mage'
)
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT DO NOTHING;

-- Blood Elf
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'blood-elf'
JOIN wow_classes c ON c.class_key IN (
    'paladin','hunter','rogue','priest','mage','warlock'
)
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT DO NOTHING;


-- ============================================================
-- MISTS OF PANDARIA CLASSIC
-- ============================================================

-- HUMAN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'human'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','rogue','priest',
    'death-knight','mage','warlock','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- DWARF
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'dwarf'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','rogue','priest',
    'death-knight','shaman','mage','warlock','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- NIGHT ELF
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'night-elf'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest',
    'death-knight','mage','monk','druid'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- GNOME
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'gnome'
JOIN wow_classes c ON c.class_key IN (
    'warrior','rogue','priest',
    'death-knight','mage','warlock','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- DRAENEI
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'draenei'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','priest',
    'death-knight','shaman','mage','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- WORGEN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'worgen'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest',
    'death-knight','mage','warlock','druid'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- ORC
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'orc'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','death-knight',
    'shaman','mage','warlock','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- UNDEAD
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'undead'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest',
    'death-knight','mage','warlock','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- TAUREN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'tauren'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','priest',
    'death-knight','shaman','monk','druid'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- TROLL
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'troll'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest',
    'death-knight','shaman','mage','warlock',
    'monk','druid'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- BLOOD ELF
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'blood-elf'
JOIN wow_classes c ON c.class_key IN (
    'warrior','paladin','hunter','rogue','priest',
    'death-knight','mage','warlock','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- GOBLIN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'goblin'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest',
    'death-knight','shaman','mage','warlock'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;

-- PANDAREN
INSERT INTO wow_race_classes (game_version_id, race_id, class_id, is_playable)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r ON r.race_key = 'pandaren'
JOIN wow_classes c ON c.class_key IN (
    'warrior','hunter','rogue','priest',
    'shaman','mage','monk'
)
WHERE gv.game_key = 'classic-mop'
ON CONFLICT DO NOTHING;