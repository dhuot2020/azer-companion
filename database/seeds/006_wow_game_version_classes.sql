-- ============================================================
-- CLASSES DISPONIBLES PAR VERSION DE WORLD OF WARCRAFT
-- ============================================================

-- ============================================================
-- RETAIL - MIDNIGHT
-- 13 classes
-- ============================================================

INSERT INTO wow_game_version_classes (
    game_version_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    c.id,
    TRUE
FROM wow_game_versions gv
CROSS JOIN wow_classes c
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- CLASSIC ERA
-- 9 classes
-- ============================================================

INSERT INTO wow_game_version_classes (
    game_version_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    c.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_classes c
    ON c.class_key IN (
        'warrior',
        'paladin',
        'hunter',
        'rogue',
        'priest',
        'shaman',
        'mage',
        'warlock',
        'druid'
    )
WHERE gv.game_key = 'classic-era'
ON CONFLICT (game_version_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- CLASSIC HARDCORE
-- 9 classes
-- ============================================================

INSERT INTO wow_game_version_classes (
    game_version_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    c.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_classes c
    ON c.class_key IN (
        'warrior',
        'paladin',
        'hunter',
        'rogue',
        'priest',
        'shaman',
        'mage',
        'warlock',
        'druid'
    )
WHERE gv.game_key = 'classic-hardcore'
ON CONFLICT (game_version_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- SEASON OF DISCOVERY
-- Même base de 9 classes
-- ============================================================

INSERT INTO wow_game_version_classes (
    game_version_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    c.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_classes c
    ON c.class_key IN (
        'warrior',
        'paladin',
        'hunter',
        'rogue',
        'priest',
        'shaman',
        'mage',
        'warlock',
        'druid'
    )
WHERE gv.game_key = 'classic-season-of-discovery'
ON CONFLICT (game_version_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- BURNING CRUSADE CLASSIC ANNIVERSARY
-- 9 classes
-- ============================================================

INSERT INTO wow_game_version_classes (
    game_version_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    c.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_classes c
    ON c.class_key IN (
        'warrior',
        'paladin',
        'hunter',
        'rogue',
        'priest',
        'shaman',
        'mage',
        'warlock',
        'druid'
    )
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;


-- ============================================================
-- MISTS OF PANDARIA CLASSIC
-- 11 classes
-- ============================================================

INSERT INTO wow_game_version_classes (
    game_version_id,
    class_id,
    is_playable
)
SELECT
    gv.id,
    c.id,
    TRUE
FROM wow_game_versions gv
JOIN wow_classes c
    ON c.class_key IN (
        'warrior',
        'paladin',
        'hunter',
        'rogue',
        'priest',
        'death-knight',
        'shaman',
        'mage',
        'warlock',
        'monk',
        'druid'
    )
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, class_id) DO UPDATE
SET is_playable = EXCLUDED.is_playable;