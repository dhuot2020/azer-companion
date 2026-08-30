-- ============================================================
-- 011 - ARBRES DE TALENTS CLASSIC
-- ============================================================
--
-- Utilisé pour :
--   Classic Era
--   Classic Hardcore
--   Season of Discovery
--   Burning Crusade Classic Anniversary
--
-- Ces versions utilisent le système historique
-- d'arbres de talents plutôt que les spécialisations
-- formelles modernes.
-- ============================================================


-- ============================================================
-- DEFINITIONS GLOBALES DES ARBRES
-- ============================================================

INSERT INTO wow_talent_tree_definitions (
    class_id,
    tree_key,
    tree_name
)
SELECT
    c.id,
    v.tree_key,
    v.tree_name
FROM wow_classes c
JOIN (
    VALUES

    -- Warrior
    ('warrior', 'arms', 'Armes'),
    ('warrior', 'fury', 'Fureur'),
    ('warrior', 'protection', 'Protection'),

    -- Paladin
    ('paladin', 'holy', 'Sacré'),
    ('paladin', 'protection', 'Protection'),
    ('paladin', 'retribution', 'Vindicte'),

    -- Hunter
    ('hunter', 'beast-mastery', 'Maîtrise des bêtes'),
    ('hunter', 'marksmanship', 'Précision'),
    ('hunter', 'survival', 'Survie'),

    -- Rogue
    ('rogue', 'assassination', 'Assassinat'),
    ('rogue', 'combat', 'Combat'),
    ('rogue', 'subtlety', 'Finesse'),

    -- Priest
    ('priest', 'discipline', 'Discipline'),
    ('priest', 'holy', 'Sacré'),
    ('priest', 'shadow', 'Ombre'),

    -- Shaman
    ('shaman', 'elemental', 'Élémentaire'),
    ('shaman', 'enhancement', 'Amélioration'),
    ('shaman', 'restoration', 'Restauration'),

    -- Mage
    ('mage', 'arcane', 'Arcanes'),
    ('mage', 'fire', 'Feu'),
    ('mage', 'frost', 'Givre'),

    -- Warlock
    ('warlock', 'affliction', 'Affliction'),
    ('warlock', 'demonology', 'Démonologie'),
    ('warlock', 'destruction', 'Destruction'),

    -- Druid
    ('druid', 'balance', 'Équilibre'),
    ('druid', 'feral-combat', 'Combat farouche'),
    ('druid', 'restoration', 'Restauration')

) AS v(class_key, tree_key, tree_name)
    ON c.class_key = v.class_key

ON CONFLICT (class_id, tree_key) DO UPDATE
SET
    tree_name = EXCLUDED.tree_name,
    updated_at = NOW();


-- ============================================================
-- ASSOCIATION AUX 4 VERSIONS CLASSIC AVEC TALENT TREES
-- ============================================================

INSERT INTO wow_game_version_talent_trees (
    game_version_id,
    talent_tree_id,
    version_tree_key,
    version_tree_name,
    sort_order,
    is_available
)
SELECT
    gv.id,
    t.id,
    t.tree_key,
    t.tree_name,

    CASE t.tree_key
        WHEN 'arms' THEN 1
        WHEN 'holy' THEN 1
        WHEN 'beast-mastery' THEN 1
        WHEN 'assassination' THEN 1
        WHEN 'discipline' THEN 1
        WHEN 'elemental' THEN 1
        WHEN 'arcane' THEN 1
        WHEN 'affliction' THEN 1
        WHEN 'balance' THEN 1

        WHEN 'fury' THEN 2
        WHEN 'marksmanship' THEN 2
        WHEN 'combat' THEN 2
        WHEN 'enhancement' THEN 2
        WHEN 'fire' THEN 2
        WHEN 'demonology' THEN 2
        WHEN 'feral-combat' THEN 2

        ELSE 3
    END,

    TRUE

FROM wow_game_versions gv
CROSS JOIN wow_talent_tree_definitions t
JOIN wow_classes c
    ON c.id = t.class_id

WHERE gv.game_key IN (
    'classic-era',
    'classic-hardcore',
    'classic-season-of-discovery',
    'classic-anniversary-tbc'
)

AND EXISTS (
    SELECT 1
    FROM wow_game_version_classes gvc
    WHERE gvc.game_version_id = gv.id
      AND gvc.class_id = c.id
      AND gvc.is_playable = TRUE
)

ON CONFLICT (
    game_version_id,
    talent_tree_id
)
DO UPDATE
SET
    version_tree_key = EXCLUDED.version_tree_key,
    version_tree_name = EXCLUDED.version_tree_name,
    sort_order = EXCLUDED.sort_order,
    is_available = TRUE;