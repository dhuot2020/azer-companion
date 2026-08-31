BEGIN;

CREATE TABLE wow_game_version_reputations (
    id BIGSERIAL PRIMARY KEY,
    game_version_id BIGINT NOT NULL REFERENCES wow_game_versions(id) ON DELETE CASCADE,
    reputation_id BIGINT NOT NULL REFERENCES reputation_definitions(id) ON DELETE CASCADE,
    expansion_id BIGINT REFERENCES wow_expansions(id) ON DELETE SET NULL,
    reputation_system VARCHAR(30) NOT NULL DEFAULT 'standing',
    is_account_wide BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_version_id, reputation_id),
    CONSTRAINT chk_reputation_system CHECK
      (reputation_system IN ('standing','renown','culture','activity'))
);

CREATE INDEX idx_gvr_version ON wow_game_version_reputations(game_version_id);
CREATE INDEX idx_gvr_expansion ON wow_game_version_reputations(expansion_id);

CREATE TABLE reputation_rank_definitions (
    id BIGSERIAL PRIMARY KEY,
    rank_key VARCHAR(80) NOT NULL UNIQUE,
    rank_name VARCHAR(120) NOT NULL,
    rank_order INTEGER NOT NULL,
    minimum_value INTEGER,
    maximum_value INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_reputations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    reputation_id BIGINT NOT NULL REFERENCES reputation_definitions(id) ON DELETE CASCADE,
    rank_id BIGINT REFERENCES reputation_rank_definitions(id) ON DELETE SET NULL,
    reputation_value INTEGER,
    renown_level INTEGER,
    is_maxed BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, reputation_id)
);

ALTER TABLE character_reputations
    ADD COLUMN IF NOT EXISTS rank_id BIGINT
        REFERENCES reputation_rank_definitions(id)
        ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS renown_level INTEGER,
    ADD COLUMN IF NOT EXISTS is_maxed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

INSERT INTO schema_migrations(version, description)
VALUES ('013_reputation_system',
        'Ajout des reputations par version, rangs, renown et progression account-wide')
ON CONFLICT (version) DO NOTHING;

COMMIT;
