BEGIN;

-- ============================================================
-- 017 - COLLECTIONS ACCOUNT-WIDE / WARBAND
-- ============================================================

CREATE TABLE wow_game_version_mounts (
    id BIGSERIAL PRIMARY KEY,
    game_version_id BIGINT NOT NULL REFERENCES wow_game_versions(id) ON DELETE CASCADE,
    mount_id BIGINT NOT NULL REFERENCES mount_definitions(id) ON DELETE CASCADE,
    expansion_id BIGINT REFERENCES wow_expansions(id) ON DELETE SET NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_version_id, mount_id)
);

CREATE TABLE wow_game_version_pets (
    id BIGSERIAL PRIMARY KEY,
    game_version_id BIGINT NOT NULL REFERENCES wow_game_versions(id) ON DELETE CASCADE,
    pet_id BIGINT NOT NULL REFERENCES pet_definitions(id) ON DELETE CASCADE,
    expansion_id BIGINT REFERENCES wow_expansions(id) ON DELETE SET NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_version_id, pet_id)
);

CREATE INDEX idx_game_version_mounts_version ON wow_game_version_mounts(game_version_id);
CREATE INDEX idx_game_version_pets_version ON wow_game_version_pets(game_version_id);

-- Sources d'acquisition normalisees.
CREATE TABLE collection_source_definitions (
    id BIGSERIAL PRIMARY KEY,
    source_key VARCHAR(80) NOT NULL UNIQUE,
    source_name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mount_acquisition_sources (
    id BIGSERIAL PRIMARY KEY,
    mount_id BIGINT NOT NULL REFERENCES mount_definitions(id) ON DELETE CASCADE,
    source_type_id BIGINT NOT NULL REFERENCES collection_source_definitions(id) ON DELETE CASCADE,
    source_name VARCHAR(255),
    zone_id BIGINT REFERENCES wow_zones(id) ON DELETE SET NULL,
    instance_id BIGINT REFERENCES instance_definitions(id) ON DELETE SET NULL,
    boss_id BIGINT REFERENCES boss_definitions(id) ON DELETE SET NULL,
    quest_id BIGINT REFERENCES quest_definitions(id) ON DELETE SET NULL,
    reputation_id BIGINT REFERENCES reputation_definitions(id) ON DELETE SET NULL,
    drop_rate NUMERIC(8,5),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pet_acquisition_sources (
    id BIGSERIAL PRIMARY KEY,
    pet_id BIGINT NOT NULL REFERENCES pet_definitions(id) ON DELETE CASCADE,
    source_type_id BIGINT NOT NULL REFERENCES collection_source_definitions(id) ON DELETE CASCADE,
    source_name VARCHAR(255),
    zone_id BIGINT REFERENCES wow_zones(id) ON DELETE SET NULL,
    instance_id BIGINT REFERENCES instance_definitions(id) ON DELETE SET NULL,
    boss_id BIGINT REFERENCES boss_definitions(id) ON DELETE SET NULL,
    quest_id BIGINT REFERENCES quest_definitions(id) ON DELETE SET NULL,
    reputation_id BIGINT REFERENCES reputation_definitions(id) ON DELETE SET NULL,
    drop_rate NUMERIC(8,5),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mount_sources_mount ON mount_acquisition_sources(mount_id);
CREATE INDEX idx_pet_sources_pet ON pet_acquisition_sources(pet_id);

-- Enrichissement des instances de mascottes possedees.
ALTER TABLE account_pet_instances
    ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pet_level INTEGER,
    ADD COLUMN IF NOT EXISTS quality INTEGER,
    ADD COLUMN IF NOT EXISTS breed_id INTEGER,
    ADD COLUMN IF NOT EXISTS health INTEGER,
    ADD COLUMN IF NOT EXISTS power INTEGER,
    ADD COLUMN IF NOT EXISTS speed INTEGER,
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Synchronisation des montures du compte.
ALTER TABLE account_mounts
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS first_collected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

INSERT INTO schema_migrations(version, description)
VALUES (
    '017_collection_system',
    'Ajout des collections montures/mascottes par version et des sources acquisition'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
