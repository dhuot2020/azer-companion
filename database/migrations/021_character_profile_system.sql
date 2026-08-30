BEGIN;

-- ============================================================
-- 021 - PROFIL PERSONNAGE / REALMS / MEDIA / GUILDES
-- ============================================================

CREATE TABLE IF NOT EXISTS wow_region_definitions (
    id BIGSERIAL PRIMARY KEY,
    region_key VARCHAR(20) NOT NULL UNIQUE,
    region_name VARCHAR(100) NOT NULL,
    locale_default VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wow_realm_definitions (
    id BIGSERIAL PRIMARY KEY,

    region_id BIGINT NOT NULL
        REFERENCES wow_region_definitions(id)
        ON DELETE CASCADE,

    blizzard_realm_id BIGINT,

    realm_slug VARCHAR(120) NOT NULL,
    realm_name VARCHAR(150) NOT NULL,

    locale VARCHAR(20),
    timezone VARCHAR(80),

    connected_realm_id BIGINT,

    is_tournament BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(region_id, realm_slug)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_wow_realms_blizzard_id
    ON wow_realm_definitions(region_id, blizzard_realm_id)
    WHERE blizzard_realm_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wow_realms_connected_realm
    ON wow_realm_definitions(connected_realm_id);


-- ============================================================
-- NORMALISATION DU PERSONNAGE
-- ============================================================

ALTER TABLE wow_characters
    ADD COLUMN IF NOT EXISTS realm_id BIGINT
        REFERENCES wow_realm_definitions(id)
        ON DELETE SET NULL,

    ADD COLUMN IF NOT EXISTS gender VARCHAR(30),

    ADD COLUMN IF NOT EXISTS average_item_level INTEGER,

    ADD COLUMN IF NOT EXISTS equipped_item_level INTEGER,

    ADD COLUMN IF NOT EXISTS achievement_points INTEGER,

    ADD COLUMN IF NOT EXISTS active_title VARCHAR(255),

    ADD COLUMN IF NOT EXISTS last_profile_sync_at TIMESTAMPTZ,

    ADD COLUMN IF NOT EXISTS last_media_sync_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wow_characters_realm_id
    ON wow_characters(realm_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_wow_characters_blizzard_identity
    ON wow_characters(region, blizzard_character_id)
    WHERE blizzard_character_id IS NOT NULL;


-- ============================================================
-- MEDIA DU PERSONNAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS character_media (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    media_type VARCHAR(50) NOT NULL,
    -- avatar / inset / main / render / other

    media_url TEXT NOT NULL,

    source VARCHAR(50) NOT NULL DEFAULT 'battle-net',

    width INTEGER,
    height INTEGER,

    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, media_type, media_url)
);

CREATE INDEX IF NOT EXISTS idx_character_media_current
    ON character_media(character_id, media_type, is_current);


-- ============================================================
-- SNAPSHOTS DE PROFIL
-- ============================================================

CREATE TABLE IF NOT EXISTS character_profile_snapshots (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    game_version_id BIGINT
        REFERENCES wow_game_versions(id)
        ON DELETE SET NULL,

    level INTEGER,
    item_level INTEGER,
    average_item_level INTEGER,
    equipped_item_level INTEGER,
    achievement_points INTEGER,

    active_specialization_id BIGINT
        REFERENCES wow_specializations(id)
        ON DELETE SET NULL,

    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    source VARCHAR(50) NOT NULL DEFAULT 'battle-net',

    payload JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_profile_snapshots_character
    ON character_profile_snapshots(character_id, captured_at);


-- ============================================================
-- GUILDES
-- ============================================================

CREATE TABLE IF NOT EXISTS wow_guild_definitions (
    id BIGSERIAL PRIMARY KEY,

    region_id BIGINT NOT NULL
        REFERENCES wow_region_definitions(id)
        ON DELETE CASCADE,

    realm_id BIGINT
        REFERENCES wow_realm_definitions(id)
        ON DELETE SET NULL,

    blizzard_guild_id BIGINT,

    guild_name VARCHAR(150) NOT NULL,
    guild_slug VARCHAR(180),

    faction VARCHAR(20),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_wow_guild_blizzard_identity
    ON wow_guild_definitions(region_id, blizzard_guild_id)
    WHERE blizzard_guild_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wow_guild_realm
    ON wow_guild_definitions(realm_id);


CREATE TABLE IF NOT EXISTS character_guild_memberships (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    guild_id BIGINT NOT NULL
        REFERENCES wow_guild_definitions(id)
        ON DELETE CASCADE,

    rank INTEGER,
    rank_name VARCHAR(120),

    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,

    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_character_current_guild
    ON character_guild_memberships(character_id)
    WHERE is_current = TRUE;

CREATE INDEX IF NOT EXISTS idx_character_guild_memberships_guild
    ON character_guild_memberships(guild_id);


INSERT INTO schema_migrations(version, description)
VALUES (
    '021_character_profile_system',
    'Ajout regions, realms, media, snapshots de profil et guildes'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
