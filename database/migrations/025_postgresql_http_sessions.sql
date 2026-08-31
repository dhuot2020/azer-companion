BEGIN;

CREATE TABLE IF NOT EXISTS app_http_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    session_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_http_sessions_expiry
    ON app_http_sessions(expires_at);

INSERT INTO schema_migrations(version, description)
VALUES (
    '025_postgresql_http_sessions',
    'Sessions HTTP Express persistantes et partagees entre les instances Node'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
