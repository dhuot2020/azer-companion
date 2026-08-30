-- ============================================================
-- 035 - PROFESSIONS DISPONIBLES PAR VERSION
-- ============================================================

-- Classic Era / Hardcore / SoD : 9 primaires + 3 secondaires
INSERT INTO wow_game_version_professions (
    game_version_id, profession_id, profession_type, is_primary, is_available
)
SELECT
    gv.id,
    p.id,
    CASE
        WHEN p.profession_key IN ('herbalism','mining','skinning')
            THEN 'gathering'
        WHEN p.profession_key IN ('cooking','first-aid','fishing')
            THEN 'secondary'
        ELSE 'crafting'
    END,
    NOT (p.profession_key IN ('cooking','first-aid','fishing')),
    TRUE
FROM wow_game_versions gv
JOIN profession_definitions p
    ON p.profession_key IN (
        'alchemy','blacksmithing','enchanting','engineering',
        'herbalism','leatherworking','mining','skinning','tailoring',
        'cooking','first-aid','fishing'
    )
WHERE gv.game_key IN (
    'classic-era',
    'classic-hardcore',
    'classic-season-of-discovery'
)
ON CONFLICT (game_version_id, profession_id) DO UPDATE
SET profession_type = EXCLUDED.profession_type,
    is_primary = EXCLUDED.is_primary,
    is_available = TRUE,
    updated_at = NOW();


-- TBC Anniversary : + Jewelcrafting
INSERT INTO wow_game_version_professions (
    game_version_id, profession_id, profession_type, is_primary, is_available
)
SELECT
    gv.id,
    p.id,
    CASE
        WHEN p.profession_key IN ('herbalism','mining','skinning')
            THEN 'gathering'
        WHEN p.profession_key IN ('cooking','first-aid','fishing')
            THEN 'secondary'
        ELSE 'crafting'
    END,
    NOT (p.profession_key IN ('cooking','first-aid','fishing')),
    TRUE
FROM wow_game_versions gv
JOIN profession_definitions p
    ON p.profession_key IN (
        'alchemy','blacksmithing','enchanting','engineering',
        'herbalism','jewelcrafting','leatherworking','mining',
        'skinning','tailoring','cooking','first-aid','fishing'
    )
WHERE gv.game_key = 'classic-anniversary-tbc'
ON CONFLICT (game_version_id, profession_id) DO UPDATE
SET profession_type = EXCLUDED.profession_type,
    is_primary = EXCLUDED.is_primary,
    is_available = TRUE,
    updated_at = NOW();


-- MoP Classic : 11 primaires + Archaeology/Cooking/First Aid/Fishing
INSERT INTO wow_game_version_professions (
    game_version_id, profession_id, profession_type, is_primary, is_available
)
SELECT
    gv.id,
    p.id,
    CASE
        WHEN p.profession_key IN ('herbalism','mining','skinning')
            THEN 'gathering'
        WHEN p.profession_key IN ('archaeology','cooking','first-aid','fishing')
            THEN 'secondary'
        ELSE 'crafting'
    END,
    NOT (p.profession_key IN ('archaeology','cooking','first-aid','fishing')),
    TRUE
FROM wow_game_versions gv
CROSS JOIN profession_definitions p
WHERE gv.game_key = 'classic-mop'
ON CONFLICT (game_version_id, profession_id) DO UPDATE
SET profession_type = EXCLUDED.profession_type,
    is_primary = EXCLUDED.is_primary,
    is_available = TRUE,
    updated_at = NOW();


-- Retail Midnight : 11 primaires + Archaeology/Cooking/Fishing
-- First Aid n'est plus une profession separée.
INSERT INTO wow_game_version_professions (
    game_version_id, profession_id, profession_type, is_primary, is_available
)
SELECT
    gv.id,
    p.id,
    CASE
        WHEN p.profession_key IN ('herbalism','mining','skinning')
            THEN 'gathering'
        WHEN p.profession_key IN ('archaeology','cooking','fishing')
            THEN 'secondary'
        ELSE 'crafting'
    END,
    NOT (p.profession_key IN ('archaeology','cooking','fishing')),
    TRUE
FROM wow_game_versions gv
JOIN profession_definitions p
    ON p.profession_key <> 'first-aid'
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, profession_id) DO UPDATE
SET profession_type = EXCLUDED.profession_type,
    is_primary = EXCLUDED.is_primary,
    is_available = TRUE,
    updated_at = NOW();
