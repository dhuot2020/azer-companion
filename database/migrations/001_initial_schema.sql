BEGIN;

-- ============================================================
-- 001 - MIGRATIONS
-- ============================================================

CREATE TABLE schema_migrations (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 002 - UTILISATEURS
-- ============================================================

CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,

    display_name VARCHAR(100),
    email VARCHAR(255),

    locale VARCHAR(20) NOT NULL DEFAULT 'fr_CA',
    preferred_region VARCHAR(20) NOT NULL DEFAULT 'us',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_app_users_email
    ON app_users(email)
    WHERE email IS NOT NULL;


CREATE TABLE user_battle_net_accounts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    battle_net_account_id VARCHAR(100) NOT NULL,
    battle_tag VARCHAR(100),

    region VARCHAR(20) NOT NULL DEFAULT 'us',

    last_authenticated_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(region, battle_net_account_id)
);

CREATE INDEX idx_bnet_accounts_user
    ON user_battle_net_accounts(user_id);


-- ============================================================
-- 003 - REFERENTIEL CLASSES WOW
-- ============================================================

CREATE TABLE wow_classes (
    id BIGSERIAL PRIMARY KEY,

    blizzard_class_id INTEGER UNIQUE,
    class_key VARCHAR(50) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE wow_specializations (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL
        REFERENCES wow_classes(id)
        ON DELETE CASCADE,

    blizzard_spec_id INTEGER UNIQUE,
    spec_key VARCHAR(50) NOT NULL,
    spec_name VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(class_id, spec_key)
);


-- ============================================================
-- 004 - PERSONNAGES
-- ============================================================

CREATE TABLE wow_characters (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    battle_net_account_id BIGINT
        REFERENCES user_battle_net_accounts(id)
        ON DELETE SET NULL,

    blizzard_character_id BIGINT,

    character_name VARCHAR(100) NOT NULL,

    realm_name VARCHAR(100) NOT NULL,
    realm_slug VARCHAR(100) NOT NULL,

    region VARCHAR(20) NOT NULL DEFAULT 'us',

    faction VARCHAR(20),
    race_name VARCHAR(100),

    class_id BIGINT
        REFERENCES wow_classes(id)
        ON DELETE SET NULL,

    active_specialization_id BIGINT
        REFERENCES wow_specializations(id)
        ON DELETE SET NULL,

    level INTEGER,
    item_level INTEGER,

    last_login_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, region, realm_slug, character_name)
);

CREATE INDEX idx_characters_user
    ON wow_characters(user_id);

CREATE INDEX idx_characters_class
    ON wow_characters(class_id);


-- ============================================================
-- 005 - QUETES : DEFINITIONS
-- ============================================================

CREATE TABLE quest_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_quest_id BIGINT NOT NULL UNIQUE,

    quest_name VARCHAR(255),

    expansion_key VARCHAR(50),
    zone_name VARCHAR(150),

    quest_type VARCHAR(50),

    class_id BIGINT
        REFERENCES wow_classes(id)
        ON DELETE SET NULL,

    is_class_quest BOOLEAN NOT NULL DEFAULT FALSE,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,

    quest_chain_key VARCHAR(100),

    description TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quest_definitions_class
    ON quest_definitions(class_id);

CREATE INDEX idx_quest_definitions_chain
    ON quest_definitions(quest_chain_key);


-- ============================================================
-- 006 - QUETES : PROGRESSION PERSONNAGE
-- ============================================================

CREATE TABLE character_quests (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    quest_id BIGINT NOT NULL
        REFERENCES quest_definitions(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'unknown',

    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, quest_id)
);

CREATE INDEX idx_character_quests_character
    ON character_quests(character_id);

CREATE INDEX idx_character_quests_status
    ON character_quests(character_id, status);


-- ============================================================
-- 007 - CONTENU DE CLASSE
-- ============================================================

CREATE TABLE class_content_definitions (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL
        REFERENCES wow_classes(id)
        ON DELETE CASCADE,

    specialization_id BIGINT
        REFERENCES wow_specializations(id)
        ON DELETE SET NULL,

    content_key VARCHAR(150) NOT NULL,

    content_name VARCHAR(255) NOT NULL,

    content_type VARCHAR(50) NOT NULL,
    -- campaign
    -- class_quest
    -- tome
    -- taming_unlock
    -- ability
    -- feature
    -- artifact
    -- class_hall

    description TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(class_id, content_key)
);

CREATE INDEX idx_class_content_class
    ON class_content_definitions(class_id);

CREATE INDEX idx_class_content_type
    ON class_content_definitions(class_id, content_type);


CREATE TABLE character_class_progress (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    class_content_id BIGINT NOT NULL
        REFERENCES class_content_definitions(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'unknown',

    current_value NUMERIC,
    target_value NUMERIC,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, class_content_id)
);

CREATE INDEX idx_class_progress_character
    ON character_class_progress(character_id);


-- ============================================================
-- 008 - CREATURES / BESTIAIRE
-- ============================================================

CREATE TABLE creature_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_creature_id BIGINT UNIQUE,

    creature_key VARCHAR(150),

    creature_name VARCHAR(255) NOT NULL,

    family_name VARCHAR(100),
    subfamily_name VARCHAR(100),

    rarity VARCHAR(50),

    is_tameable BOOLEAN NOT NULL DEFAULT FALSE,
    is_exotic BOOLEAN NOT NULL DEFAULT FALSE,
    is_spirit_beast BOOLEAN NOT NULL DEFAULT FALSE,
    is_rare BOOLEAN NOT NULL DEFAULT FALSE,

    expansion_key VARCHAR(50),
    zone_name VARCHAR(150),

    coordinate_x NUMERIC(8,4),
    coordinate_y NUMERIC(8,4),

    image_url TEXT,
    reference_url TEXT,

    required_class_content_id BIGINT
        REFERENCES class_content_definitions(id)
        ON DELETE SET NULL,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creatures_family
    ON creature_definitions(family_name);

CREATE INDEX idx_creatures_tameable
    ON creature_definitions(is_tameable);

CREATE INDEX idx_creatures_rare
    ON creature_definitions(is_rare);


CREATE TABLE character_tames (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    creature_id BIGINT NOT NULL
        REFERENCES creature_definitions(id)
        ON DELETE CASCADE,

    is_tamed BOOLEAN NOT NULL DEFAULT FALSE,

    tamed_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, creature_id)
);

CREATE INDEX idx_character_tames_character
    ON character_tames(character_id);

CREATE INDEX idx_character_tames_state
    ON character_tames(character_id, is_tamed);


-- ============================================================
-- 009 - PROFESSIONS
-- ============================================================

CREATE TABLE profession_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_profession_id INTEGER UNIQUE,

    profession_key VARCHAR(100) NOT NULL UNIQUE,
    profession_name VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE character_professions (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    profession_id BIGINT NOT NULL
        REFERENCES profession_definitions(id)
        ON DELETE CASCADE,

    skill_level INTEGER,
    max_skill_level INTEGER,

    is_primary BOOLEAN NOT NULL DEFAULT TRUE,

    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, profession_id)
);


-- ============================================================
-- 010 - REPUTATIONS
-- ============================================================

CREATE TABLE reputation_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_faction_id BIGINT UNIQUE,

    reputation_key VARCHAR(150),
    reputation_name VARCHAR(255) NOT NULL,

    expansion_key VARCHAR(50),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE character_reputations (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    reputation_id BIGINT NOT NULL
        REFERENCES reputation_definitions(id)
        ON DELETE CASCADE,

    standing VARCHAR(50),

    current_value INTEGER,
    max_value INTEGER,

    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, reputation_id)
);


-- ============================================================
-- 011 - DONJONS / RAIDS
-- ============================================================

CREATE TABLE instance_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_instance_id BIGINT UNIQUE,

    instance_key VARCHAR(150),

    instance_name VARCHAR(255) NOT NULL,

    instance_type VARCHAR(30) NOT NULL,
    -- dungeon
    -- raid

    expansion_key VARCHAR(50),

    zone_name VARCHAR(150),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE boss_definitions (
    id BIGSERIAL PRIMARY KEY,

    instance_id BIGINT NOT NULL
        REFERENCES instance_definitions(id)
        ON DELETE CASCADE,

    blizzard_encounter_id BIGINT,

    boss_name VARCHAR(255) NOT NULL,

    boss_order INTEGER,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(instance_id, boss_name)
);


CREATE TABLE character_instance_progress (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    instance_id BIGINT NOT NULL
        REFERENCES instance_definitions(id)
        ON DELETE CASCADE,

    difficulty VARCHAR(50) NOT NULL DEFAULT 'unknown',

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    bosses_killed INTEGER,
    bosses_total INTEGER,

    last_completed_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, instance_id, difficulty)
);


CREATE TABLE character_boss_kills (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    boss_id BIGINT NOT NULL
        REFERENCES boss_definitions(id)
        ON DELETE CASCADE,

    difficulty VARCHAR(50) NOT NULL DEFAULT 'unknown',

    kill_count INTEGER NOT NULL DEFAULT 0,

    first_kill_at TIMESTAMPTZ,
    last_kill_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, boss_id, difficulty)
);


-- ============================================================
-- 012 - MONTURES
-- ============================================================

CREATE TABLE mount_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_mount_id BIGINT UNIQUE,

    mount_name VARCHAR(255) NOT NULL,

    source_type VARCHAR(100),
    expansion_key VARCHAR(50),

    image_url TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE account_mounts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    mount_id BIGINT NOT NULL
        REFERENCES mount_definitions(id)
        ON DELETE CASCADE,

    collected BOOLEAN NOT NULL DEFAULT FALSE,

    collected_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, mount_id)
);


-- ============================================================
-- 013 - MASCOTTES
-- ============================================================

CREATE TABLE pet_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_species_id BIGINT UNIQUE,

    pet_name VARCHAR(255) NOT NULL,

    pet_type VARCHAR(100),

    source_type VARCHAR(100),
    expansion_key VARCHAR(50),

    image_url TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE account_pet_instances (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    pet_id BIGINT NOT NULL
        REFERENCES pet_definitions(id)
        ON DELETE CASCADE,

    battle_pet_guid VARCHAR(150),

    custom_name VARCHAR(100),

    level INTEGER,
    quality VARCHAR(30),

    breed VARCHAR(50),

    health INTEGER,
    power INTEGER,
    speed INTEGER,

    collected_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_account_pet_guid
    ON account_pet_instances(user_id, battle_pet_guid)
    WHERE battle_pet_guid IS NOT NULL;

CREATE INDEX idx_account_pet_species
    ON account_pet_instances(user_id, pet_id);


-- ============================================================
-- 014 - HAUTS FAITS
-- ============================================================

CREATE TABLE achievement_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_achievement_id BIGINT UNIQUE,

    achievement_name VARCHAR(255) NOT NULL,

    description TEXT,

    points INTEGER,

    expansion_key VARCHAR(50),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE character_achievements (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    achievement_id BIGINT NOT NULL
        REFERENCES achievement_definitions(id)
        ON DELETE CASCADE,

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, achievement_id)
);


-- ============================================================
-- 015 - COLLECTOR
-- ============================================================

CREATE TABLE collector_devices (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    device_uuid UUID NOT NULL UNIQUE,

    device_name VARCHAR(150),

    collector_version VARCHAR(50),

    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE collector_imports (
    id BIGSERIAL PRIMARY KEY,

    device_id BIGINT
        REFERENCES collector_devices(id)
        ON DELETE SET NULL,

    user_id BIGINT NOT NULL
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    character_id BIGINT
        REFERENCES wow_characters(id)
        ON DELETE SET NULL,

    collector_version VARCHAR(50),

    import_status VARCHAR(30) NOT NULL DEFAULT 'success',

    records_received INTEGER NOT NULL DEFAULT 0,
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_failed INTEGER NOT NULL DEFAULT 0,

    raw_payload JSONB,

    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collector_imports_user
    ON collector_imports(user_id);

CREATE INDEX idx_collector_imports_character
    ON collector_imports(character_id);

CREATE INDEX idx_collector_imports_date
    ON collector_imports(imported_at);


CREATE TABLE collector_import_errors (
    id BIGSERIAL PRIMARY KEY,

    import_id BIGINT NOT NULL
        REFERENCES collector_imports(id)
        ON DELETE CASCADE,

    error_type VARCHAR(100),

    entity_type VARCHAR(100),

    entity_identifier VARCHAR(255),

    error_message TEXT NOT NULL,

    raw_data JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 016 - VERSION DE LA MIGRATION
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '001_initial_schema',
    'Schema initial multiuser Azer Compagnion'
);

COMMIT;
