BEGIN;

-- ============================================================
-- 012 - PROFESSIONS PAR VERSION / CATEGORIE / SPECIALISATION
-- ============================================================

CREATE TABLE wow_game_version_professions (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    profession_id BIGINT NOT NULL
        REFERENCES profession_definitions(id)
        ON DELETE CASCADE,

    profession_type VARCHAR(30) NOT NULL,
    -- crafting / gathering / secondary

    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, profession_id),

    CONSTRAINT chk_game_version_profession_type
        CHECK (profession_type IN ('crafting', 'gathering', 'secondary'))
);

CREATE INDEX idx_game_version_professions_version
    ON wow_game_version_professions(game_version_id);


CREATE TABLE wow_profession_categories (
    id BIGSERIAL PRIMARY KEY,

    profession_id BIGINT NOT NULL
        REFERENCES profession_definitions(id)
        ON DELETE CASCADE,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    category_key VARCHAR(150) NOT NULL,
    category_name VARCHAR(200) NOT NULL,

    max_skill INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(profession_id, category_key)
);

CREATE INDEX idx_profession_categories_profession
    ON wow_profession_categories(profession_id);

CREATE INDEX idx_profession_categories_expansion
    ON wow_profession_categories(expansion_id);


CREATE TABLE character_profession_skills (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    profession_category_id BIGINT NOT NULL
        REFERENCES wow_profession_categories(id)
        ON DELETE CASCADE,

    skill_level INTEGER NOT NULL DEFAULT 0,
    max_skill_level INTEGER,

    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, profession_category_id)
);

CREATE INDEX idx_character_profession_skills_character
    ON character_profession_skills(character_id);


CREATE TABLE profession_specialization_definitions (
    id BIGSERIAL PRIMARY KEY,

    profession_id BIGINT NOT NULL
        REFERENCES profession_definitions(id)
        ON DELETE CASCADE,

    specialization_key VARCHAR(150) NOT NULL,
    specialization_name VARCHAR(200) NOT NULL,

    parent_specialization_id BIGINT
        REFERENCES profession_specialization_definitions(id)
        ON DELETE SET NULL,

    description TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(profession_id, specialization_key)
);

CREATE INDEX idx_profession_specs_profession
    ON profession_specialization_definitions(profession_id);


CREATE TABLE wow_game_version_profession_specializations (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    specialization_id BIGINT NOT NULL
        REFERENCES profession_specialization_definitions(id)
        ON DELETE CASCADE,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, specialization_id)
);


CREATE TABLE character_profession_specializations (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    specialization_id BIGINT NOT NULL
        REFERENCES profession_specialization_definitions(id)
        ON DELETE CASCADE,

    is_learned BOOLEAN NOT NULL DEFAULT FALSE,

    points_spent INTEGER,
    learned_at TIMESTAMPTZ,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, specialization_id)
);

CREATE INDEX idx_character_prof_specs_character
    ON character_profession_specializations(character_id);


INSERT INTO schema_migrations(version, description)
VALUES (
    '012_profession_system',
    'Ajout des professions par version, categories de competence et specialisations'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
