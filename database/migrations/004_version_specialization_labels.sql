BEGIN;

-- ============================================================
-- 004 - LIBELLES DE SPECIALISATION PAR VERSION WOW
-- ============================================================
--
-- Une même spécialisation Blizzard peut changer de nom
-- selon la version du jeu.
--
-- Exemple :
--   Rogue spec 260
--   MoP Classic = Combat
--   Retail      = Outlaw
--
-- wow_specializations conserve l'identité globale.
-- wow_game_version_specializations contient la représentation
-- spécifique à chaque version.
-- ============================================================


ALTER TABLE wow_game_version_specializations
    ADD COLUMN version_spec_key VARCHAR(100);

ALTER TABLE wow_game_version_specializations
    ADD COLUMN version_spec_name VARCHAR(150);


-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_game_version_specs_key
    ON wow_game_version_specializations(
        game_version_id,
        version_spec_key
    );


-- ============================================================
-- MIGRATION
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '004_version_specialization_labels',
    'Ajout des noms et cles de specialisation propres a chaque version WoW'
);

COMMIT;