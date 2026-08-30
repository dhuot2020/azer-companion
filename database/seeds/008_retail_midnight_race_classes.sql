-- ============================================================
-- 008 - RETAIL MIDNIGHT
-- COMBINAISONS RACE / CLASSE
-- ============================================================

-- ============================================================
-- CLASSES DISPONIBLES POUR TOUTES LES RACES
-- Warrior / Hunter / Mage / Priest / Rogue / Warlock
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    r.id,
    c.id,
    TRUE
FROM wow_game_versions gv
CROSS JOIN wow_races r
JOIN wow_classes c
    ON c.class_key IN (
        'warrior',
        'hunter',
        'mage',
        'priest',
        'rogue',
        'warlock'
    )
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- DRUID
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'night-elf',
        'worgen',
        'kul-tiran',
        'haranir',
        'tauren',
        'troll',
        'highmountain',
        'zandalari'
    )
JOIN wow_classes c
    ON c.class_key = 'druid'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- SHAMAN
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'dwarf',
        'draenei',
        'pandaren',
        'dark-iron-dwarf',
        'kul-tiran',
        'earthen',
        'haranir',
        'orc',
        'tauren',
        'troll',
        'goblin',
        'highmountain',
        'maghar-orc',
        'zandalari',
        'vulpera'
    )
JOIN wow_classes c
    ON c.class_key = 'shaman'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- PALADIN
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'human',
        'dwarf',
        'draenei',
        'lightforged',
        'dark-iron-dwarf',
        'earthen',
        'tauren',
        'blood-elf',
        'zandalari'
    )
JOIN wow_classes c
    ON c.class_key = 'paladin'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- MONK
-- Toutes sauf Dracthyr actuellement
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
CROSS JOIN wow_races r
JOIN wow_classes c
    ON c.class_key = 'monk'
WHERE gv.game_key = 'retail-midnight'
  AND r.race_key <> 'dracthyr'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- DEATH KNIGHT
-- Pas Dracthyr / Earthen / Haranir actuellement
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
CROSS JOIN wow_races r
JOIN wow_classes c
    ON c.class_key = 'death-knight'
WHERE gv.game_key = 'retail-midnight'
  AND r.race_key NOT IN (
      'dracthyr',
      'earthen',
      'haranir'
  )
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- DEMON HUNTER
-- Midnight ajoute Void Elf
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key IN (
        'night-elf',
        'void-elf',
        'blood-elf'
    )
JOIN wow_classes c
    ON c.class_key = 'demon-hunter'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- EVOKER
-- ============================================================

INSERT INTO wow_race_classes (
    game_version_id,
    race_id,
    class_id,
    is_playable
)
SELECT gv.id, r.id, c.id, TRUE
FROM wow_game_versions gv
JOIN wow_races r
    ON r.race_key = 'dracthyr'
JOIN wow_classes c
    ON c.class_key = 'evoker'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, race_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;