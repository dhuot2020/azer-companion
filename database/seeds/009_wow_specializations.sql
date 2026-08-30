-- ============================================================
-- 009 - SPECIALISATIONS RETAIL / MIDNIGHT
-- ============================================================

-- ------------------------------------------------------------
-- DEFINITIONS GLOBALES
-- ------------------------------------------------------------

INSERT INTO wow_specializations (
    class_id,
    spec_key,
    spec_name
)
SELECT c.id, v.spec_key, v.spec_name
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
    ('rogue', 'outlaw', 'Hors-la-loi'),
    ('rogue', 'subtlety', 'Finesse'),

    -- Priest
    ('priest', 'discipline', 'Discipline'),
    ('priest', 'holy', 'Sacré'),
    ('priest', 'shadow', 'Ombre'),

    -- Death Knight
    ('death-knight', 'blood', 'Sang'),
    ('death-knight', 'frost', 'Givre'),
    ('death-knight', 'unholy', 'Impie'),

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

    -- Monk
    ('monk', 'brewmaster', 'Maître brasseur'),
    ('monk', 'mistweaver', 'Tisse-brume'),
    ('monk', 'windwalker', 'Marche-vent'),

    -- Druid
    ('druid', 'balance', 'Équilibre'),
    ('druid', 'feral', 'Farouche'),
    ('druid', 'guardian', 'Gardien'),
    ('druid', 'restoration', 'Restauration'),

    -- Demon Hunter
    ('demon-hunter', 'havoc', 'Dévastation'),
    ('demon-hunter', 'vengeance', 'Vengeance'),
    ('demon-hunter', 'devourer', 'Dévoration'),

    -- Evoker
    ('evoker', 'devastation', 'Dévastation'),
    ('evoker', 'preservation', 'Préservation'),
    ('evoker', 'augmentation', 'Augmentation')

) AS v(class_key, spec_key, spec_name)
    ON c.class_key = v.class_key

ON CONFLICT (class_id, spec_key) DO UPDATE
SET
    spec_name = EXCLUDED.spec_name,
    updated_at = NOW();


-- ============================================================
-- ASSOCIATION AVEC RETAIL / MIDNIGHT
-- ============================================================

INSERT INTO wow_game_version_specializations (
    game_version_id,
    specialization_id,
    primary_role,
    sort_order,
    version_spec_key,
    version_spec_name,
    is_available
)
SELECT
    gv.id,
    s.id,

    CASE
        -- Tanks
        WHEN c.class_key = 'warrior'      AND s.spec_key = 'protection' THEN 'tank'
        WHEN c.class_key = 'paladin'      AND s.spec_key = 'protection' THEN 'tank'
        WHEN c.class_key = 'death-knight' AND s.spec_key = 'blood' THEN 'tank'
        WHEN c.class_key = 'monk'         AND s.spec_key = 'brewmaster' THEN 'tank'
        WHEN c.class_key = 'druid'        AND s.spec_key = 'guardian' THEN 'tank'
        WHEN c.class_key = 'demon-hunter' AND s.spec_key = 'vengeance' THEN 'tank'

        -- Healers
        WHEN c.class_key = 'paladin' AND s.spec_key = 'holy' THEN 'healer'
        WHEN c.class_key = 'priest'  AND s.spec_key IN ('discipline', 'holy') THEN 'healer'
        WHEN c.class_key = 'shaman'  AND s.spec_key = 'restoration' THEN 'healer'
        WHEN c.class_key = 'monk'    AND s.spec_key = 'mistweaver' THEN 'healer'
        WHEN c.class_key = 'druid'   AND s.spec_key = 'restoration' THEN 'healer'
        WHEN c.class_key = 'evoker'  AND s.spec_key = 'preservation' THEN 'healer'

        -- Tout le reste
        ELSE 'damage'
    END,

    ROW_NUMBER() OVER (
        PARTITION BY c.id
        ORDER BY s.id
    ),

    s.spec_key,
    s.spec_name,
    TRUE

FROM wow_game_versions gv
CROSS JOIN wow_specializations s
JOIN wow_classes c
    ON c.id = s.class_id

WHERE gv.game_key = 'retail-midnight'

ON CONFLICT (game_version_id, specialization_id) DO UPDATE
SET
    primary_role = EXCLUDED.primary_role,
    sort_order = EXCLUDED.sort_order,
    version_spec_key = EXCLUDED.version_spec_key,
    version_spec_name = EXCLUDED.version_spec_name,
    is_available = TRUE;