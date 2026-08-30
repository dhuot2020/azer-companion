BEGIN;

CREATE TABLE collector_data_domains (
    id BIGSERIAL PRIMARY KEY,
    domain_key VARCHAR(80) NOT NULL UNIQUE,
    domain_name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collector_import_domains (
    id BIGSERIAL PRIMARY KEY,
    collector_import_id BIGINT NOT NULL REFERENCES collector_imports(id) ON DELETE CASCADE,
    domain_id BIGINT NOT NULL REFERENCES collector_data_domains(id) ON DELETE CASCADE,
    records_received INTEGER NOT NULL DEFAULT 0,
    records_inserted INTEGER NOT NULL DEFAULT 0,
    records_updated INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB,
    UNIQUE(collector_import_id, domain_id),
    CONSTRAINT chk_collector_domain_status
      CHECK(status IN ('pending','processing','success','partial','failed','skipped'))
);

CREATE INDEX idx_collector_import_domains_import
    ON collector_import_domains(collector_import_id);

CREATE TABLE collector_character_snapshots (
    id BIGSERIAL PRIMARY KEY,
    collector_import_id BIGINT NOT NULL REFERENCES collector_imports(id) ON DELETE CASCADE,
    character_id BIGINT REFERENCES wow_characters(id) ON DELETE SET NULL,
    game_version_id BIGINT REFERENCES wow_game_versions(id) ON DELETE SET NULL,
    character_name VARCHAR(100),
    realm_name VARCHAR(150),
    level INTEGER,
    class_id BIGINT REFERENCES wow_classes(id) ON DELETE SET NULL,
    specialization_id BIGINT REFERENCES wow_specializations(id) ON DELETE SET NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collector_snapshots_character
    ON collector_character_snapshots(character_id,captured_at);

CREATE TABLE collector_sync_cursors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    character_id BIGINT REFERENCES wow_characters(id) ON DELETE CASCADE,
    domain_id BIGINT NOT NULL REFERENCES collector_data_domains(id) ON DELETE CASCADE,
    cursor_value TEXT,
    last_successful_import_id BIGINT REFERENCES collector_imports(id) ON DELETE SET NULL,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_collector_sync_cursor
ON collector_sync_cursors(
    user_id,
    COALESCE(character_id,0),
    domain_id
);

ALTER TABLE collector_imports
    ADD COLUMN IF NOT EXISTS payload_version VARCHAR(50),
    ADD COLUMN IF NOT EXISTS addon_version VARCHAR(50),
    ADD COLUMN IF NOT EXISTS game_version_id BIGINT REFERENCES wow_game_versions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS processing_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_collector_imports_status
    ON collector_imports(processing_status);

CREATE INDEX IF NOT EXISTS idx_collector_imports_hash
    ON collector_imports(payload_hash);

INSERT INTO schema_migrations(version,description)
VALUES('019_collector_sync_system',
       'Ajout domaines, snapshots, curseurs et suivi detaille des imports Collector')
ON CONFLICT(version) DO NOTHING;

COMMIT;
