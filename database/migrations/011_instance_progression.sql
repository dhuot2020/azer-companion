BEGIN;

CREATE TABLE wow_difficulty_definitions (
    id BIGSERIAL PRIMARY KEY,
    difficulty_key VARCHAR(100) NOT NULL UNIQUE,
    difficulty_name VARCHAR(150) NOT NULL,
    content_type VARCHAR(30) NOT NULL,
    is_keystone BOOLEAN NOT NULL DEFAULT FALSE,
    is_legacy BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wow_difficulty_content_type
        CHECK (content_type IN ('dungeon', 'raid', 'both'))
);

CREATE TABLE wow_game_version_instance_difficulties (
    id BIGSERIAL PRIMARY KEY,
    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id) ON DELETE CASCADE,
    instance_id BIGINT NOT NULL
        REFERENCES instance_definitions(id) ON DELETE CASCADE,
    difficulty_id BIGINT NOT NULL
        REFERENCES wow_difficulty_definitions(id) ON DELETE CASCADE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    minimum_level INTEGER,
    maximum_level INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_version_id, instance_id, difficulty_id)
);

CREATE INDEX idx_gvid_version_instance
    ON wow_game_version_instance_difficulties(game_version_id, instance_id);

CREATE INDEX idx_gvid_difficulty
    ON wow_game_version_instance_difficulties(difficulty_id);

ALTER TABLE character_instance_progress
    ADD COLUMN difficulty_id BIGINT
        REFERENCES wow_difficulty_definitions(id)
        ON DELETE SET NULL;

ALTER TABLE character_boss_kills
    ADD COLUMN difficulty_id BIGINT
        REFERENCES wow_difficulty_definitions(id)
        ON DELETE SET NULL;

CREATE INDEX idx_character_instance_progress_difficulty
    ON character_instance_progress(difficulty_id);

CREATE INDEX idx_character_boss_kills_difficulty
    ON character_boss_kills(difficulty_id);

CREATE TABLE character_instance_lockouts (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id) ON DELETE CASCADE,
    instance_id BIGINT NOT NULL
        REFERENCES instance_definitions(id) ON DELETE CASCADE,
    difficulty_id BIGINT NOT NULL
        REFERENCES wow_difficulty_definitions(id) ON DELETE CASCADE,
    lockout_key VARCHAR(150),
    started_at TIMESTAMPTZ,
    reset_at TIMESTAMPTZ,
    bosses_killed INTEGER NOT NULL DEFAULT 0,
    bosses_total INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(character_id, instance_id, difficulty_id, lockout_key)
);

CREATE INDEX idx_character_lockouts_character
    ON character_instance_lockouts(character_id);

CREATE INDEX idx_character_lockouts_active
    ON character_instance_lockouts(character_id, is_active);

CREATE TABLE character_boss_kill_events (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id) ON DELETE CASCADE,
    boss_id BIGINT NOT NULL
        REFERENCES boss_definitions(id) ON DELETE CASCADE,
    difficulty_id BIGINT
        REFERENCES wow_difficulty_definitions(id) ON DELETE SET NULL,
    lockout_id BIGINT
        REFERENCES character_instance_lockouts(id) ON DELETE SET NULL,
    killed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boss_kill_events_character
    ON character_boss_kill_events(character_id, killed_at);

CREATE INDEX idx_boss_kill_events_boss
    ON character_boss_kill_events(boss_id, killed_at);

CREATE INDEX idx_boss_kill_events_lockout
    ON character_boss_kill_events(lockout_id);

INSERT INTO schema_migrations(version, description)
VALUES (
    '011_instance_progression',
    'Ajout des difficultes, lockouts et historique detaille des kills de boss'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
