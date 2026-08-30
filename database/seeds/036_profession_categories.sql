-- ============================================================
-- 036 - CATEGORIES DE COMPETENCE PAR EXTENSION
-- ============================================================

-- Midnight : les professions principales ont 100 points.
INSERT INTO wow_profession_categories (
    profession_id,
    expansion_id,
    category_key,
    category_name,
    max_skill
)
SELECT
    p.id,
    e.id,
    'midnight-' || p.profession_key,
    'Midnight ' || p.profession_name,
    CASE WHEN p.profession_key = 'fishing' THEN 300 ELSE 100 END
FROM profession_definitions p
JOIN wow_expansions e
    ON e.expansion_key = 'midnight'
WHERE p.profession_key IN (
    'alchemy','blacksmithing','enchanting','engineering',
    'herbalism','inscription','jewelcrafting','leatherworking',
    'mining','skinning','tailoring','cooking','fishing'
)
ON CONFLICT (profession_id, category_key) DO UPDATE
SET
    category_name = EXCLUDED.category_name,
    expansion_id = EXCLUDED.expansion_id,
    max_skill = EXCLUDED.max_skill,
    updated_at = NOW();


-- MoP Classic : categorie Pandaria, max historique 600 global.
-- On stocke ici 600 comme plafond de progression de l'epoque.
INSERT INTO wow_profession_categories (
    profession_id,
    expansion_id,
    category_key,
    category_name,
    max_skill
)
SELECT
    p.id,
    e.id,
    'mop-' || p.profession_key,
    'Pandarie - ' || p.profession_name,
    600
FROM profession_definitions p
JOIN wow_expansions e
    ON e.expansion_key = 'mists-of-pandaria'
WHERE p.profession_key IN (
    'alchemy','blacksmithing','enchanting','engineering',
    'herbalism','inscription','jewelcrafting','leatherworking',
    'mining','skinning','tailoring','archaeology','cooking',
    'first-aid','fishing'
)
ON CONFLICT (profession_id, category_key) DO UPDATE
SET
    category_name = EXCLUDED.category_name,
    expansion_id = EXCLUDED.expansion_id,
    max_skill = EXCLUDED.max_skill,
    updated_at = NOW();
