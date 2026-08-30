BEGIN;

-- ============================================================
-- 022 - PREFERENCES UTILISATEUR / FAVORIS / CHECKLISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    preference_key VARCHAR(120) NOT NULL,
    preference_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user
    ON user_preferences(user_id);


CREATE TABLE IF NOT EXISTS user_favorite_types (
    id BIGSERIAL PRIMARY KEY,
    favorite_type_key VARCHAR(80) NOT NULL UNIQUE,
    favorite_type_name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    character_id BIGINT REFERENCES wow_characters(id) ON DELETE CASCADE,
    favorite_type_id BIGINT NOT NULL REFERENCES user_favorite_types(id) ON DELETE CASCADE,
    target_key VARCHAR(200) NOT NULL,
    target_id BIGINT,
    label VARCHAR(255),
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_favorites_scope
ON user_favorites(
    user_id,
    COALESCE(character_id, 0),
    favorite_type_id,
    target_key
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user
    ON user_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_character
    ON user_favorites(character_id);


CREATE TABLE IF NOT EXISTS checklist_definitions (
    id BIGSERIAL PRIMARY KEY,
    checklist_key VARCHAR(150) NOT NULL UNIQUE,
    checklist_name VARCHAR(255) NOT NULL,
    description TEXT,
    game_version_id BIGINT REFERENCES wow_game_versions(id) ON DELETE SET NULL,
    class_id BIGINT REFERENCES wow_classes(id) ON DELETE SET NULL,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_item_definitions (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES checklist_definitions(id) ON DELETE CASCADE,
    item_key VARCHAR(180) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(80),
    target_id BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(checklist_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist
    ON checklist_item_definitions(checklist_id);


CREATE TABLE IF NOT EXISTS user_checklists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    character_id BIGINT REFERENCES wow_characters(id) ON DELETE CASCADE,
    checklist_id BIGINT NOT NULL REFERENCES checklist_definitions(id) ON DELETE CASCADE,
    custom_name VARCHAR(255),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_checklist_scope
ON user_checklists(
    user_id,
    COALESCE(character_id, 0),
    checklist_id
);

CREATE INDEX IF NOT EXISTS idx_user_checklists_user
    ON user_checklists(user_id);


CREATE TABLE IF NOT EXISTS user_checklist_item_progress (
    id BIGSERIAL PRIMARY KEY,
    user_checklist_id BIGINT NOT NULL REFERENCES user_checklists(id) ON DELETE CASCADE,
    checklist_item_id BIGINT NOT NULL REFERENCES checklist_item_definitions(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    progress_current BIGINT NOT NULL DEFAULT 0,
    progress_target BIGINT,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_checklist_id, checklist_item_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_progress_checklist
    ON user_checklist_item_progress(user_checklist_id);

CREATE INDEX IF NOT EXISTS idx_checklist_progress_completed
    ON user_checklist_item_progress(user_checklist_id, completed);


CREATE TABLE IF NOT EXISTS user_character_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    character_id BIGINT NOT NULL REFERENCES wow_characters(id) ON DELETE CASCADE,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    custom_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_user_character_preferences_user
    ON user_character_preferences(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_default_character
    ON user_character_preferences(user_id)
    WHERE is_default = TRUE;


INSERT INTO schema_migrations(version, description)
VALUES (
    '022_user_preferences_checklists',
    'Ajout preferences utilisateur, favoris, checklists et preferences de personnages'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
