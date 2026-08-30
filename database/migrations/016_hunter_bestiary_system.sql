BEGIN;

-- ============================================================
-- 016 - BESTIAIRE HUNTER DETAILLE
-- ============================================================

CREATE TABLE hunter_pet_family_definitions (
    id BIGSERIAL PRIMARY KEY,

    family_key VARCHAR(120) NOT NULL UNIQUE,
    family_name VARCHAR(160) NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hunter_taming_skill_definitions (
    id BIGSERIAL PRIMARY KEY,

    skill_key VARCHAR(150) NOT NULL UNIQUE,
    skill_name VARCHAR(200) NOT NULL,

    unlock_type VARCHAR(50) NOT NULL DEFAULT 'tome',
    -- tome / racial / quest / achievement / default / other

    account_wide BOOLEAN NOT NULL DEFAULT FALSE,

    description TEXT,
    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_hunter_taming_unlock_type
        CHECK (unlock_type IN ('tome','racial','quest','achievement','default','other'))
);

CREATE TABLE wow_game_version_pet_families (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    family_id BIGINT NOT NULL
        REFERENCES hunter_pet_family_definitions(id)
        ON DELETE CASCADE,

    required_taming_skill_id BIGINT
        REFERENCES hunter_taming_skill_definitions(id)
        ON DELETE SET NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_exotic BOOLEAN NOT NULL DEFAULT FALSE,
    beast_mastery_only BOOLEAN NOT NULL DEFAULT FALSE,

    minimum_hunter_level INTEGER,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, family_id)
);

CREATE INDEX idx_game_version_pet_families_version
    ON wow_game_version_pet_families(game_version_id);

CREATE INDEX idx_game_version_pet_families_family
    ON wow_game_version_pet_families(family_id);

CREATE TABLE wow_game_version_taming_skills (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    skill_id BIGINT NOT NULL
        REFERENCES hunter_taming_skill_definitions(id)
        ON DELETE CASCADE,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    source_quest_id BIGINT
        REFERENCES quest_definitions(id)
        ON DELETE SET NULL,

    source_item_id BIGINT,
    source_creature_id BIGINT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, skill_id)
);

CREATE TABLE character_taming_skills (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    skill_id BIGINT NOT NULL
        REFERENCES hunter_taming_skill_definitions(id)
        ON DELETE CASCADE,

    is_learned BOOLEAN NOT NULL DEFAULT FALSE,
    learned_at TIMESTAMPTZ,

    source VARCHAR(50),
    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, skill_id)
);

CREATE INDEX idx_character_taming_skills_character
    ON character_taming_skills(character_id);

CREATE TABLE creature_appearance_definitions (
    id BIGSERIAL PRIMARY KEY,

    appearance_key VARCHAR(180) NOT NULL UNIQUE,
    appearance_name VARCHAR(255),

    family_id BIGINT
        REFERENCES hunter_pet_family_definitions(id)
        ON DELETE SET NULL,

    model_name VARCHAR(200),
    color_name VARCHAR(150),

    image_url TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creature_appearances_family
    ON creature_appearance_definitions(family_id);

CREATE TABLE creature_spawn_definitions (
    id BIGSERIAL PRIMARY KEY,

    creature_id BIGINT NOT NULL
        REFERENCES creature_definitions(id)
        ON DELETE CASCADE,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    zone_id BIGINT
        REFERENCES wow_zones(id)
        ON DELETE SET NULL,

    coordinate_x NUMERIC(8,4),
    coordinate_y NUMERIC(8,4),

    spawn_type VARCHAR(40) NOT NULL DEFAULT 'normal',
    -- normal / rare / elite / rare_elite / event / quest / instance

    respawn_min_seconds INTEGER,
    respawn_max_seconds INTEGER,

    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creature_spawns_creature
    ON creature_spawn_definitions(creature_id);

CREATE INDEX idx_creature_spawns_zone
    ON creature_spawn_definitions(game_version_id, zone_id);

ALTER TABLE creature_definitions
    ADD COLUMN IF NOT EXISTS pet_family_id BIGINT
        REFERENCES hunter_pet_family_definitions(id)
        ON DELETE SET NULL,

    ADD COLUMN IF NOT EXISTS appearance_id BIGINT
        REFERENCES creature_appearance_definitions(id)
        ON DELETE SET NULL,

    ADD COLUMN IF NOT EXISTS npc_id BIGINT,

    ADD COLUMN IF NOT EXISTS is_elite BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_rare_elite BOOLEAN
        NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_creatures_pet_family
    ON creature_definitions(pet_family_id);

CREATE INDEX IF NOT EXISTS idx_creatures_appearance
    ON creature_definitions(appearance_id);

CREATE INDEX IF NOT EXISTS idx_creatures_npc_id
    ON creature_definitions(npc_id);

-- character_tames reste la table de progression par personnage.
-- On enrichit seulement l'origine de la detection.
ALTER TABLE character_tames
    ADD COLUMN IF NOT EXISTS first_detected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS collector_import_id BIGINT
        REFERENCES collector_imports(id)
        ON DELETE SET NULL;

INSERT INTO schema_migrations(version, description)
VALUES (
    '016_hunter_bestiary_system',
    'Ajout familles de familiers, competences de domptage, apparences et spawns'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
