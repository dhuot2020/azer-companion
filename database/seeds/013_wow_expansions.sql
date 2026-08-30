-- ============================================================
-- 013 - EXTENSIONS WORLD OF WARCRAFT
-- ============================================================

INSERT INTO wow_expansions (
    expansion_key,
    expansion_name,
    release_order,
    level_cap,
    release_date,
    is_retail_expansion
)
VALUES

    (
        'classic',
        'World of Warcraft',
        0,
        60,
        DATE '2004-11-23',
        TRUE
    ),

    (
        'the-burning-crusade',
        'The Burning Crusade',
        1,
        70,
        DATE '2007-01-16',
        TRUE
    ),

    (
        'wrath-of-the-lich-king',
        'Wrath of the Lich King',
        2,
        80,
        DATE '2008-11-13',
        TRUE
    ),

    (
        'cataclysm',
        'Cataclysm',
        3,
        85,
        DATE '2010-12-07',
        TRUE
    ),

    (
        'mists-of-pandaria',
        'Mists of Pandaria',
        4,
        90,
        DATE '2012-09-25',
        TRUE
    ),

    (
        'warlords-of-draenor',
        'Warlords of Draenor',
        5,
        100,
        DATE '2014-11-13',
        TRUE
    ),

    (
        'legion',
        'Legion',
        6,
        110,
        DATE '2016-08-30',
        TRUE
    ),

    (
        'battle-for-azeroth',
        'Battle for Azeroth',
        7,
        120,
        DATE '2018-08-14',
        TRUE
    ),

    (
        'shadowlands',
        'Shadowlands',
        8,
        60,
        DATE '2020-11-23',
        TRUE
    ),

    (
        'dragonflight',
        'Dragonflight',
        9,
        70,
        DATE '2022-11-28',
        TRUE
    ),

    (
        'the-war-within',
        'The War Within',
        10,
        80,
        DATE '2024-08-26',
        TRUE
    ),

    (
        'midnight',
        'Midnight',
        11,
        90,
        DATE '2026-03-03',
        TRUE
    )

ON CONFLICT (expansion_key) DO UPDATE
SET
    expansion_name = EXCLUDED.expansion_name,
    release_order = EXCLUDED.release_order,
    level_cap = EXCLUDED.level_cap,
    release_date = EXCLUDED.release_date,
    is_retail_expansion = EXCLUDED.is_retail_expansion,
    updated_at = NOW();