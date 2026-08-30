BEGIN;

-- ============================================================
-- 015 - SYSTEME DE QUETES DETAILLE
-- ============================================================

CREATE TABLE quest_type_definitions (
    id BIGSERIAL PRIMARY KEY,
    quest_type_key VARCHAR(80) NOT NULL UNIQUE,
    quest_type_name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quest_definitions
    ADD COLUMN IF NOT EXISTS quest_type_id BIGINT
        REFERENCES quest_type_definitions(id)
        ON DELETE SET NULL,

    ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_daily BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_weekly BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_world_quest BOOLEAN
        NOT NULL DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS is_campaign BOOLEAN
        NOT NULL DEFAULT FALSE;


-- ============================================================
-- QUETES DISPONIBLES PAR VERSION DE WOW
-- ============================================================

CREATE TABLE wow_game_version_quests (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    zone_id BIGINT
        REFERENCES wow_zones(id)
        ON DELETE SET NULL,

    version_quest_name VARCHAR(255),

    minimum_level INTEGER,
    maximum_level INTEGER,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    -- Retail moderne / Warband
    is_warband_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    first_completion_account_wide BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, quest_id)
);

CREATE INDEX idx_game_version_quests_version
    ON wow_game_version_quests(game_version_id);

CREATE INDEX idx_game_version_quests_zone
    ON wow_game_version_quests(zone_id);

CREATE INDEX idx_game_version_quests_expansion
    ON wow_game_version_quests(expansion_id);


-- ============================================================
-- CHAINES DE QUETES
-- ============================================================

CREATE TABLE quest_chain_definitions (
    id BIGSERIAL PRIMARY KEY,

    chain_key VARCHAR(150) NOT NULL UNIQUE,
    chain_name VARCHAR(255) NOT NULL,

    class_id BIGINT
        REFERENCES wow_classes(id)
        ON DELETE SET NULL,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    description TEXT,

    is_campaign BOOLEAN NOT NULL DEFAULT FALSE,
    is_class_chain BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quest_chains_class
    ON quest_chain_definitions(class_id);

CREATE INDEX idx_quest_chains_expansion
    ON quest_chain_definitions(expansion_id);


CREATE TABLE quest_chain_steps (
    id BIGSERIAL PRIMARY KEY,

    chain_id BIGINT NOT NULL
        REFERENCES quest_chain_definitions(id)
        ON DELETE CASCADE,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    step_order INTEGER NOT NULL,

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(chain_id, quest_id),
    UNIQUE(chain_id, step_order)
);

CREATE INDEX idx_quest_chain_steps_chain
    ON quest_chain_steps(chain_id, step_order);


-- ============================================================
-- PREREQUIS ENTRE QUETES
-- ============================================================

CREATE TABLE quest_prerequisites (
    id BIGSERIAL PRIMARY KEY,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    prerequisite_quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    requirement_type VARCHAR(30) NOT NULL DEFAULT 'required',
    -- required / optional / one_of

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(quest_id, prerequisite_quest_id),

    CONSTRAINT chk_quest_prerequisite_type
        CHECK (requirement_type IN ('required', 'optional', 'one_of')),

    CONSTRAINT chk_quest_not_self_prerequisite
        CHECK (quest_id <> prerequisite_quest_id)
);

CREATE INDEX idx_quest_prerequisites_quest
    ON quest_prerequisites(quest_id);


-- ============================================================
-- OBJECTIFS DE QUETE
-- ============================================================

CREATE TABLE quest_objective_definitions (
    id BIGSERIAL PRIMARY KEY,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    objective_index INTEGER NOT NULL,

    objective_type VARCHAR(50),
    -- kill / collect / interact / explore / currency / reputation / other

    description TEXT,

    target_id BIGINT,
    required_count INTEGER NOT NULL DEFAULT 1,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(quest_id, objective_index)
);

CREATE INDEX idx_quest_objectives_quest
    ON quest_objective_definitions(quest_id);


CREATE TABLE character_quest_objectives (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    objective_id BIGINT NOT NULL
        REFERENCES quest_objective_definitions(id)
        ON DELETE CASCADE,

    current_count INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    last_seen_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, objective_id)
);

CREATE INDEX idx_character_quest_objectives_character
    ON character_quest_objectives(character_id);


-- ============================================================
-- PREMIERE COMPLETION AU NIVEAU DU COMPTE / WARBAND
-- ============================================================

CREATE TABLE account_quest_completions (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    first_character_id BIGINT
        REFERENCES wow_characters(id)
        ON DELETE SET NULL,

    first_completed_at TIMESTAMPTZ,

    completion_count INTEGER NOT NULL DEFAULT 1,

    last_completed_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_account_quest_completions_user
    ON account_quest_completions(user_id);


-- ============================================================
-- LIEN ENTRE CONTENU DE CLASSE ET QUETES
-- ============================================================

CREATE TABLE class_content_quests (
    id BIGSERIAL PRIMARY KEY,

    class_content_id BIGINT NOT NULL
        REFERENCES class_content_definitions(id)
        ON DELETE CASCADE,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    step_order INTEGER,

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(class_content_id, quest_id)
);

CREATE INDEX idx_class_content_quests_content
    ON class_content_quests(class_content_id);


INSERT INTO schema_migrations(version, description)
VALUES (
    '015_quest_system',
    'Ajout des versions de quetes, chaines, prerequis, objectifs et completions Warband'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
