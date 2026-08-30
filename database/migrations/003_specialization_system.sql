BEGIN;

-- ============================================================
-- 003 - SYSTEME DE SPECIALISATIONS PAR VERSION WOW
-- ============================================================

ALTER TABLE wow_game_versions
    ADD COLUMN specialization_system VARCHAR(30)
        NOT NULL
        DEFAULT 'formal_specialization';


-- Classic Era / Hardcore / SoD / TBC
-- utilisent des arbres de talents plutôt qu'une spécialisation
-- formelle telle qu'on la connait dans Retail moderne.

UPDATE wow_game_versions
SET specialization_system = 'talent_tree'
WHERE game_key IN (
    'classic-era',
    'classic-hardcore',
    'classic-season-of-discovery',
    'classic-anniversary-tbc'
);


-- MoP Classic et Retail utilisent le système de spécialisation
-- formelle.

UPDATE wow_game_versions
SET specialization_system = 'formal_specialization'
WHERE game_key IN (
    'classic-mop',
    'retail-midnight'
);


ALTER TABLE wow_game_versions
    ADD CONSTRAINT chk_wow_game_versions_specialization_system
    CHECK (
        specialization_system IN (
            'talent_tree',
            'formal_specialization'
        )
    );


-- ============================================================
-- ENRICHIR LA RELATION VERSION / SPECIALISATION
-- ============================================================

ALTER TABLE wow_game_version_specializations
    ADD COLUMN primary_role VARCHAR(20);

ALTER TABLE wow_game_version_specializations
    ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;


ALTER TABLE wow_game_version_specializations
    ADD CONSTRAINT chk_wow_game_version_specs_role
    CHECK (
        primary_role IS NULL
        OR primary_role IN (
            'tank',
            'healer',
            'damage'
        )
    );


-- ============================================================
-- MIGRATION
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '003_specialization_system',
    'Distinction entre arbres de talents Classic et specialisations formelles'
);

COMMIT;