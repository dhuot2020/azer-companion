BEGIN;

-- ============================================================
-- 023 - SECURITE / OAUTH BATTLE.NET / SESSIONS
-- IMPORTANT:
-- Les tokens OAuth ne sont jamais stockes en clair.
-- Les colonnes *_encrypted attendent un chiffrement applicatif.
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_provider_definitions (
    id BIGSERIAL PRIMARY KEY,
    provider_key VARCHAR(50) NOT NULL UNIQUE,
    provider_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_auth_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    provider_id BIGINT NOT NULL REFERENCES auth_provider_definitions(id) ON DELETE RESTRICT,
    provider_subject VARCHAR(255) NOT NULL,
    region_key VARCHAR(20),
    display_name VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider_id, provider_subject, region_key)
);

CREATE INDEX IF NOT EXISTS idx_user_auth_identities_user
    ON user_auth_identities(user_id);

CREATE TABLE IF NOT EXISTS user_oauth_credentials (
    id BIGSERIAL PRIMARY KEY,
    auth_identity_id BIGINT NOT NULL REFERENCES user_auth_identities(id) ON DELETE CASCADE,
    access_token_encrypted BYTEA,
    refresh_token_encrypted BYTEA,
    token_type VARCHAR(50),
    scope TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    encryption_key_version INTEGER NOT NULL DEFAULT 1,
    last_refreshed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(auth_identity_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_credentials_expiry
    ON user_oauth_credentials(access_token_expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    ip_hash VARCHAR(128),
    user_agent_hash VARCHAR(128),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
    ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active
    ON user_sessions(user_id, expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS security_event_types (
    id BIGSERIAL PRIMARY KEY,
    event_type_key VARCHAR(80) NOT NULL UNIQUE,
    event_type_name VARCHAR(150) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_security_event_severity
        CHECK (severity IN ('info','warning','critical'))
);

CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    event_type_id BIGINT NOT NULL REFERENCES security_event_types(id) ON DELETE RESTRICT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash VARCHAR(128),
    user_agent_hash VARCHAR(128),
    request_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_time
    ON security_events(user_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_security_events_type_time
    ON security_events(event_type_id, occurred_at);

-- Explicit ownership bridge used by backend authorization checks.
CREATE TABLE IF NOT EXISTS user_character_access (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    character_id BIGINT NOT NULL REFERENCES wow_characters(id) ON DELETE CASCADE,
    access_level VARCHAR(30) NOT NULL DEFAULT 'owner',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, character_id),
    CONSTRAINT chk_character_access_level
        CHECK (access_level IN ('owner','read'))
);

CREATE INDEX IF NOT EXISTS idx_user_character_access_character
    ON user_character_access(character_id);

INSERT INTO schema_migrations(version,description)
VALUES(
 '023_security_oauth_sessions',
 'Ajout identites OAuth, credentials chiffres, sessions, evenements securite et controle acces personnage'
)
ON CONFLICT(version) DO NOTHING;

COMMIT;
