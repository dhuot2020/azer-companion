BEGIN;

-- ============================================================
-- 002 - VERSIONS / BRANCHES DE WORLD OF WARCRAFT
-- ============================================================

CREATE TABLE wow_game_versions (
    id BIGSERIAL PRIMARY KEY,

    game_key VARCHAR(100) NOT NULL UNIQUE,
    game_name VARCHAR(150) NOT NULL,

    game_family VARCHAR(30) NOT NULL,
    -- retail
    -- classic

    expansion_key VARCHAR(100),

    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- RACES WOW
-- ============================================================

CREATE TABLE wow_races (
    id BIGSERIAL PRIMARY KEY,

    blizzard_race_id INTEGER,

    race_key VARCHAR(100) NOT NULL,
    race_name VARCHAR(150) NOT NULL,

    is_allied_race BOOLEAN NOT NULL DEFAULT FALSE,
    is_playable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(race_key)
);


-- ============================================================
-- RACES DISPONIBLES PAR VERSION DU JEU
-- ============================================================

CREATE TABLE wow_game_version_races (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    race_id BIGINT NOT NULL
        REFERENCES wow_races(id)
        ON DELETE CASCADE,

    is_playable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, race_id)
);


-- ============================================================
-- FACTIONS DISPONIBLES POUR UNE RACE
-- ============================================================

CREATE TABLE wow_race_factions (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    race_id BIGINT NOT NULL
        REFERENCES wow_races(id)
        ON DELETE CASCADE,

    faction VARCHAR(20) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, race_id, faction)
);


-- ============================================================
-- CLASSES DISPONIBLES PAR VERSION DU JEU
-- ============================================================

CREATE TABLE wow_game_version_classes (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    class_id BIGINT NOT NULL
        REFERENCES wow_classes(id)
        ON DELETE CASCADE,

    is_playable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, class_id)
);


-- ============================================================
-- COMBINAISONS RACE / CLASSE
-- ============================================================

CREATE TABLE wow_race_classes (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    race_id BIGINT NOT NULL
        REFERENCES wow_races(id)
        ON DELETE CASCADE,

    class_id BIGINT NOT NULL
        REFERENCES wow_classes(id)
        ON DELETE CASCADE,

    is_playable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, race_id, class_id)
);


-- ============================================================
-- SPECIALISATIONS PAR VERSION DU JEU
-- ============================================================

CREATE TABLE wow_game_version_specializations (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    specialization_id BIGINT NOT NULL
        REFERENCES wow_specializations(id)
        ON DELETE CASCADE,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, specialization_id)
);


-- ============================================================
-- MODIFICATION DES PERSONNAGES
-- ============================================================

ALTER TABLE wow_characters
    ADD COLUMN game_version_id BIGINT
        REFERENCES wow_game_versions(id)
        ON DELETE RESTRICT;

ALTER TABLE wow_characters
    ADD COLUMN race_id BIGINT
        REFERENCES wow_races(id)
        ON DELETE SET NULL;

CREATE INDEX idx_characters_game_version
    ON wow_characters(game_version_id);

CREATE INDEX idx_characters_race
    ON wow_characters(race_id);


-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_game_version_races_version
    ON wow_game_version_races(game_version_id);

CREATE INDEX idx_race_factions_version_race
    ON wow_race_factions(game_version_id, race_id);

CREATE INDEX idx_game_version_classes_version
    ON wow_game_version_classes(game_version_id);

CREATE INDEX idx_race_classes_lookup
    ON wow_race_classes(game_version_id, race_id, class_id);

CREATE INDEX idx_game_version_specs_version
    ON wow_game_version_specializations(game_version_id);


-- ============================================================
-- ENREGISTREMENT MIGRATION
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '002_game_versions_races',
    'Ajout versions WoW, races, factions et compatibilites race-classe'
);

COMMIT;