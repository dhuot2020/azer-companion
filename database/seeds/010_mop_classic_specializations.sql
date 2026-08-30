-- ============================================================
-- 010 - SPECIALISATIONS MISTS OF PANDARIA CLASSIC
-- ============================================================
--
-- MoP Classic : 11 classes
-- 34 spécialisations au total
--
-- Cas particulier important :
-- Rogue spec "Outlaw" en Retail = "Combat" dans MoP.
-- L'identité globale reste la même dans wow_specializations,
-- mais le nom affiché dépend de la version.
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

    -- ========================================================
    -- ROLE PRINCIPAL
    -- ========================================================

    CASE

        -- Tanks
        WHEN c.class_key = 'warrior'
             AND s.spec_key = 'protection'
            THEN 'tank'

        WHEN c.class_key = 'paladin'
             AND s.spec_key = 'protection'
            THEN 'tank'

        WHEN c.class_key = 'death-knight'
             AND s.spec_key = 'blood'
            THEN 'tank'

        WHEN c.class_key = 'monk'
             AND s.spec_key = 'brewmaster'
            THEN 'tank'

        WHEN c.class_key = 'druid'
             AND s.spec_key = 'guardian'
            THEN 'tank'


        -- Healers
        WHEN c.class_key = 'paladin'
             AND s.spec_key = 'holy'
            THEN 'healer'

        WHEN c.class_key = 'priest'
             AND s.spec_key IN ('discipline', 'holy')
            THEN 'healer'

        WHEN c.class_key = 'shaman'
             AND s.spec_key = 'restoration'
            THEN 'healer'

        WHEN c.class_key = 'monk'
             AND s.spec_key = 'mistweaver'
            THEN 'healer'

        WHEN c.class_key = 'druid'
             AND s.spec_key = 'restoration'
            THEN 'healer'


        -- Tout le reste
        ELSE 'damage'
    END,


    -- ========================================================
    -- ORDRE D'AFFICHAGE DANS CHAQUE CLASSE
    -- ========================================================

    CASE

        -- Warrior
        WHEN c.class_key = 'warrior' AND s.spec_key = 'arms' THEN 1
        WHEN c.class_key = 'warrior' AND s.spec_key = 'fury' THEN 2
        WHEN c.class_key = 'warrior' AND s.spec_key = 'protection' THEN 3

        -- Paladin
        WHEN c.class_key = 'paladin' AND s.spec_key = 'holy' THEN 1
        WHEN c.class_key = 'paladin' AND s.spec_key = 'protection' THEN 2
        WHEN c.class_key = 'paladin' AND s.spec_key = 'retribution' THEN 3

        -- Hunter
        WHEN c.class_key = 'hunter' AND s.spec_key = 'beast-mastery' THEN 1
        WHEN c.class_key = 'hunter' AND s.spec_key = 'marksmanship' THEN 2
        WHEN c.class_key = 'hunter' AND s.spec_key = 'survival' THEN 3

        -- Rogue
        WHEN c.class_key = 'rogue' AND s.spec_key = 'assassination' THEN 1
        WHEN c.class_key = 'rogue' AND s.spec_key = 'outlaw' THEN 2
        WHEN c.class_key = 'rogue' AND s.spec_key = 'subtlety' THEN 3

        -- Priest
        WHEN c.class_key = 'priest' AND s.spec_key = 'discipline' THEN 1
        WHEN c.class_key = 'priest' AND s.spec_key = 'holy' THEN 2
        WHEN c.class_key = 'priest' AND s.spec_key = 'shadow' THEN 3

        -- Death Knight
        WHEN c.class_key = 'death-knight' AND s.spec_key = 'blood' THEN 1
        WHEN c.class_key = 'death-knight' AND s.spec_key = 'frost' THEN 2
        WHEN c.class_key = 'death-knight' AND s.spec_key = 'unholy' THEN 3

        -- Shaman
        WHEN c.class_key = 'shaman' AND s.spec_key = 'elemental' THEN 1
        WHEN c.class_key = 'shaman' AND s.spec_key = 'enhancement' THEN 2
        WHEN c.class_key = 'shaman' AND s.spec_key = 'restoration' THEN 3

        -- Mage
        WHEN c.class_key = 'mage' AND s.spec_key = 'arcane' THEN 1
        WHEN c.class_key = 'mage' AND s.spec_key = 'fire' THEN 2
        WHEN c.class_key = 'mage' AND s.spec_key = 'frost' THEN 3

        -- Warlock
        WHEN c.class_key = 'warlock' AND s.spec_key = 'affliction' THEN 1
        WHEN c.class_key = 'warlock' AND s.spec_key = 'demonology' THEN 2
        WHEN c.class_key = 'warlock' AND s.spec_key = 'destruction' THEN 3

        -- Monk
        WHEN c.class_key = 'monk' AND s.spec_key = 'brewmaster' THEN 1
        WHEN c.class_key = 'monk' AND s.spec_key = 'mistweaver' THEN 2
        WHEN c.class_key = 'monk' AND s.spec_key = 'windwalker' THEN 3

        -- Druid
        WHEN c.class_key = 'druid' AND s.spec_key = 'balance' THEN 1
        WHEN c.class_key = 'druid' AND s.spec_key = 'feral' THEN 2
        WHEN c.class_key = 'druid' AND s.spec_key = 'guardian' THEN 3
        WHEN c.class_key = 'druid' AND s.spec_key = 'restoration' THEN 4

        ELSE 99
    END,


    -- ========================================================
    -- CLE SPECIFIQUE A LA VERSION
    -- ========================================================

    CASE
        WHEN c.class_key = 'rogue'
             AND s.spec_key = 'outlaw'
            THEN 'combat'

        ELSE s.spec_key
    END,


    -- ========================================================
    -- NOM SPECIFIQUE A LA VERSION
    -- ========================================================

    CASE
        WHEN c.class_key = 'rogue'
             AND s.spec_key = 'outlaw'
            THEN 'Combat'

        ELSE s.spec_name
    END,

    TRUE

FROM wow_game_versions gv

CROSS JOIN wow_specializations s

JOIN wow_classes c
    ON c.id = s.class_id

WHERE gv.game_key = 'classic-mop'

  AND c.class_key IN (
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

ON CONFLICT (
    game_version_id,
    specialization_id
)
DO UPDATE
SET
    primary_role = EXCLUDED.primary_role,
    sort_order = EXCLUDED.sort_order,
    version_spec_key = EXCLUDED.version_spec_key,
    version_spec_name = EXCLUDED.version_spec_name,
    is_available = TRUE;