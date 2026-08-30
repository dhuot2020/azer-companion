BEGIN;

-- ============================================================
-- 007 - EXTENSIONS ET ZONES WORLD OF WARCRAFT
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE TABLE wow_expansions (
    id BIGSERIAL PRIMARY KEY,

    expansion_key VARCHAR(100) NOT NULL UNIQUE,
    expansion_name VARCHAR(150) NOT NULL,

    release_order INTEGER,

    level_cap INTEGER,

    release_date DATE,

    is_retail_expansion BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- EXTENSIONS DISPONIBLES DANS UNE VERSION DU JEU
-- ============================================================
--
-- Exemple :
--
-- retail-midnight
--   -> Vanilla
--   -> Burning Crusade
--   -> ...
--   -> Midnight
--
-- classic-anniversary-tbc
--   -> Vanilla
--   -> Burning Crusade
--
-- classic-mop
--   -> Vanilla
--   -> Burning Crusade
--   -> Wrath
--   -> Cataclysm
--   -> Mists of Pandaria
-- ============================================================

CREATE TABLE wow_game_version_expansions (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    expansion_id BIGINT NOT NULL
        REFERENCES wow_expansions(id)
        ON DELETE CASCADE,

    is_current_expansion BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, expansion_id)
);


CREATE INDEX idx_game_version_expansions_version
    ON wow_game_version_expansions(game_version_id);


-- ============================================================
-- ZONES
-- ============================================================
--
-- Définition logique globale d'une zone.
--
-- IMPORTANT :
-- On ne stocke pas ici une version précise d'Eversong Woods.
--
-- Exemple :
--
-- wow_zones
--   Eversong Woods
--
-- wow_game_version_zones
--   TBC Anniversary -> ancienne version
--   Midnight        -> version remaniée
--
-- ============================================================

CREATE TABLE wow_zones (
    id BIGSERIAL PRIMARY KEY,

    zone_key VARCHAR(150) NOT NULL UNIQUE,
    zone_name VARCHAR(200) NOT NULL,

    zone_type VARCHAR(30) NOT NULL DEFAULT 'zone',
    -- zone
    -- city
    -- subzone

    parent_zone_id BIGINT
        REFERENCES wow_zones(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE wow_zones
    ADD CONSTRAINT chk_wow_zone_type
    CHECK (
        zone_type IN (
            'zone',
            'city',
            'subzone'
        )
    );


CREATE INDEX idx_wow_zones_parent
    ON wow_zones(parent_zone_id);


-- ============================================================
-- VERSION D'UNE ZONE
-- ============================================================
--
-- Ici se trouvent les informations qui peuvent changer
-- selon Retail / Classic / extension.
-- ============================================================

CREATE TABLE wow_game_version_zones (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    zone_id BIGINT NOT NULL
        REFERENCES wow_zones(id)
        ON DELETE CASCADE,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    blizzard_map_id BIGINT,

    version_zone_name VARCHAR(200),

    minimum_level INTEGER,
    maximum_level INTEGER,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_current_version BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, zone_id)
);


CREATE INDEX idx_game_version_zones_version
    ON wow_game_version_zones(game_version_id);

CREATE INDEX idx_game_version_zones_expansion
    ON wow_game_version_zones(expansion_id);

CREATE INDEX idx_game_version_zones_map
    ON wow_game_version_zones(blizzard_map_id);


-- ============================================================
-- MIGRATION
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '007_expansions_zones',
    'Ajout des extensions et zones avec variantes selon la version WoW'
);

COMMIT;