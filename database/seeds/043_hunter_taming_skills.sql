-- ============================================================
-- 043 - COMPETENCES DE DOMPTAGE SPECIALES
-- ============================================================

INSERT INTO hunter_taming_skill_definitions (
    skill_key,
    skill_name,
    unlock_type,
    account_wide,
    description
)
VALUES
    (
        'blood-beast-taming',
        'Domptage des bêtes de sang',
        'tome',
        TRUE,
        'Compétence spéciale permettant de dompter les Blood Beasts.'
    ),
    (
        'direhorn-taming',
        'Domptage des navrecornes',
        'tome',
        FALSE,
        'Compétence de domptage des Direhorns; les chasseurs zandalari disposent d’un accès racial.'
    ),
    (
        'feathermane-taming',
        'Domptage des bêtes hybrides',
        'tome',
        TRUE,
        'Compétence apprise via le Tome of the Hybrid Beast pour dompter les Feathermanes.'
    ),
    (
        'florafaun-taming',
        'Domptage de la florafaune',
        'tome',
        TRUE,
        'Compétence Midnight permettant de dompter certaines créatures végétales.'
    )
ON CONFLICT (skill_key) DO UPDATE
SET
    skill_name = EXCLUDED.skill_name,
    unlock_type = EXCLUDED.unlock_type,
    account_wide = EXCLUDED.account_wide,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO wow_game_version_taming_skills (
    game_version_id,
    skill_id,
    is_available,
    metadata
)
SELECT
    gv.id,
    s.id,
    TRUE,
    CASE s.skill_key
        WHEN 'blood-beast-taming'
            THEN jsonb_build_object('source_note','Blood-Soaked Tome of Dark Whispers')
        WHEN 'direhorn-taming'
            THEN jsonb_build_object('source_note','Ancient Tome of Dinomancy; Zandalari racial exception')
        WHEN 'feathermane-taming'
            THEN jsonb_build_object('source_note','Tome of the Hybrid Beast')
        WHEN 'florafaun-taming'
            THEN jsonb_build_object('source_note','Trials of the Florafaun Hunter')
        ELSE '{}'::jsonb
    END
FROM wow_game_versions gv
CROSS JOIN hunter_taming_skill_definitions s
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, skill_id) DO UPDATE
SET
    is_available = TRUE,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
