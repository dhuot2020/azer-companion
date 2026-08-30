BEGIN;

-- ============================================================
-- 018 - SYSTEME DE HAUTS FAITS DETAILLE
-- ============================================================

CREATE TABLE achievement_category_definitions (
    id BIGSERIAL PRIMARY KEY,

    category_key VARCHAR(120) NOT NULL UNIQUE,
    category_name VARCHAR(180) NOT NULL,

    parent_category_id BIGINT
        REFERENCES achievement_category_definitions(id)
        ON DELETE SET NULL,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievement_categories_parent
    ON achievement_category_definitions(parent_category_id);


ALTER TABLE achievement_definitions
    ADD COLUMN IF NOT EXISTS achievement_key VARCHAR(150),

    ADD COLUMN IF NOT EXISTS category_id BIGINT
        REFERENCES achievement_category_definitions(id)
        ON DELETE SET NULL,

    ADD COLUMN IF NOT EXISTS is_account_wide BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_meta BOOLEAN
        NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS
    ux_achievement_definitions_achievement_key
    ON achievement_definitions(achievement_key)
    WHERE achievement_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS
    idx_achievement_definitions_category
    ON achievement_definitions(category_id);


-- ============================================================
-- DISPONIBILITE PAR VERSION DE WOW
-- ============================================================

CREATE TABLE wow_game_version_achievements (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    achievement_id BIGINT NOT NULL
        REFERENCES achievement_definitions(id)
        ON DELETE CASCADE,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    version_achievement_name VARCHAR(255),

    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_account_wide BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, achievement_id)
);

CREATE INDEX idx_game_version_achievements_version
    ON wow_game_version_achievements(game_version_id);

CREATE INDEX idx_game_version_achievements_expansion
    ON wow_game_version_achievements(expansion_id);


-- ============================================================
-- CRITERES DE HAUT FAIT
-- ============================================================

CREATE TABLE achievement_criteria_definitions (
    id BIGSERIAL PRIMARY KEY,

    achievement_id BIGINT NOT NULL
        REFERENCES achievement_definitions(id)
        ON DELETE CASCADE,

    criteria_index INTEGER NOT NULL,

    criteria_key VARCHAR(180),

    criteria_name VARCHAR(255),

    criteria_type VARCHAR(50),
    -- kill / quest / collect / reputation / explore / profession
    -- currency / count / event / other

    required_count BIGINT NOT NULL DEFAULT 1,

    target_id BIGINT,

    is_optional BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(achievement_id, criteria_index)
);

CREATE INDEX idx_achievement_criteria_achievement
    ON achievement_criteria_definitions(achievement_id);


-- ============================================================
-- PROGRESSION CRITERES PAR PERSONNAGE
-- ============================================================

CREATE TABLE character_achievement_criteria (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    criteria_id BIGINT NOT NULL
        REFERENCES achievement_criteria_definitions(id)
        ON DELETE CASCADE,

    current_count BIGINT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, criteria_id)
);

CREATE INDEX idx_character_achievement_criteria_character
    ON character_achievement_criteria(character_id);


-- ============================================================
-- PROGRESSION ACCOUNT-WIDE / WARBAND
-- ============================================================

CREATE TABLE account_achievements (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    achievement_id BIGINT NOT NULL
        REFERENCES achievement_definitions(id)
        ON DELETE CASCADE,

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at TIMESTAMPTZ,

    first_character_id BIGINT
        REFERENCES wow_characters(id)
        ON DELETE SET NULL,

    points_awarded INTEGER,

    source VARCHAR(50),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_account_achievements_user
    ON account_achievements(user_id);


-- ============================================================
-- PROGRESSION CRITERES AU NIVEAU DU COMPTE
-- ============================================================

CREATE TABLE account_achievement_criteria (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    criteria_id BIGINT NOT NULL
        REFERENCES achievement_criteria_definitions(id)
        ON DELETE CASCADE,

    current_count BIGINT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, criteria_id)
);

CREATE INDEX idx_account_achievement_criteria_user
    ON account_achievement_criteria(user_id);


INSERT INTO schema_migrations(version, description)
VALUES (
    '018_achievement_system',
    'Ajout categories, criteres, versions et progression account-wide des hauts faits'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
