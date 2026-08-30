BEGIN;

-- ============================================================
-- 020 - ITEMS / EQUIPEMENT / INVENTAIRE
-- ============================================================

CREATE TABLE item_quality_definitions (
    id BIGSERIAL PRIMARY KEY,

    quality_key VARCHAR(50) NOT NULL UNIQUE,
    quality_name VARCHAR(100) NOT NULL,

    quality_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE equipment_slot_definitions (
    id BIGSERIAL PRIMARY KEY,

    slot_key VARCHAR(80) NOT NULL UNIQUE,
    slot_name VARCHAR(120) NOT NULL,

    slot_group VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE item_definitions (
    id BIGSERIAL PRIMARY KEY,

    blizzard_item_id BIGINT UNIQUE,

    item_key VARCHAR(180),

    item_name VARCHAR(255) NOT NULL,

    quality_id BIGINT
        REFERENCES item_quality_definitions(id)
        ON DELETE SET NULL,

    item_class VARCHAR(100),
    item_subclass VARCHAR(100),

    inventory_type VARCHAR(100),

    required_level INTEGER,

    bind_type VARCHAR(80),

    icon_url TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_item_definitions_item_key
    ON item_definitions(item_key)
    WHERE item_key IS NOT NULL;

CREATE INDEX idx_item_definitions_blizzard
    ON item_definitions(blizzard_item_id);

CREATE INDEX idx_item_definitions_quality
    ON item_definitions(quality_id);


-- ============================================================
-- ITEM DISPONIBLE PAR VERSION DU JEU
-- ============================================================

CREATE TABLE wow_game_version_items (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    item_id BIGINT NOT NULL
        REFERENCES item_definitions(id)
        ON DELETE CASCADE,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, item_id)
);

CREATE INDEX idx_game_version_items_version
    ON wow_game_version_items(game_version_id);

CREATE INDEX idx_game_version_items_expansion
    ON wow_game_version_items(expansion_id);


-- ============================================================
-- SOURCES D'ITEMS
-- ============================================================

CREATE TABLE item_source_type_definitions (
    id BIGSERIAL PRIMARY KEY,

    source_key VARCHAR(80) NOT NULL UNIQUE,
    source_name VARCHAR(120) NOT NULL,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE item_acquisition_sources (
    id BIGSERIAL PRIMARY KEY,

    item_id BIGINT NOT NULL
        REFERENCES item_definitions(id)
        ON DELETE CASCADE,

    source_type_id BIGINT NOT NULL
        REFERENCES item_source_type_definitions(id)
        ON DELETE CASCADE,

    zone_id BIGINT
        REFERENCES wow_zones(id)
        ON DELETE SET NULL,

    instance_id BIGINT
        REFERENCES instance_definitions(id)
        ON DELETE SET NULL,

    boss_id BIGINT
        REFERENCES boss_definitions(id)
        ON DELETE SET NULL,

    quest_id BIGINT
        REFERENCES quest_definitions(id)
        ON DELETE SET NULL,

    reputation_id BIGINT
        REFERENCES reputation_definitions(id)
        ON DELETE SET NULL,

    source_name VARCHAR(255),

    drop_rate NUMERIC(8,5),

    notes TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_item_sources_item
    ON item_acquisition_sources(item_id);

CREATE INDEX idx_item_sources_instance
    ON item_acquisition_sources(instance_id);

CREATE INDEX idx_item_sources_boss
    ON item_acquisition_sources(boss_id);


-- ============================================================
-- INSTANCE D'ITEM POSSEDEE PAR UN PERSONNAGE
-- ============================================================

CREATE TABLE character_item_instances (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    item_id BIGINT NOT NULL
        REFERENCES item_definitions(id)
        ON DELETE CASCADE,

    item_guid VARCHAR(160),

    item_level INTEGER,

    quantity INTEGER NOT NULL DEFAULT 1,

    durability_current INTEGER,
    durability_max INTEGER,

    enchant_id BIGINT,

    gem_data JSONB,

    upgrade_data JSONB,

    bonus_ids JSONB,

    is_bound BOOLEAN,

    bag_index INTEGER,
    bag_slot INTEGER,

    last_seen_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    source VARCHAR(50),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_character_item_guid
    ON character_item_instances(character_id, item_guid)
    WHERE item_guid IS NOT NULL;

CREATE INDEX idx_character_items_character
    ON character_item_instances(character_id);

CREATE INDEX idx_character_items_item
    ON character_item_instances(item_id);


-- ============================================================
-- EQUIPEMENT ACTUEL
-- ============================================================

CREATE TABLE character_equipment (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    slot_id BIGINT NOT NULL
        REFERENCES equipment_slot_definitions(id)
        ON DELETE CASCADE,

    item_instance_id BIGINT
        REFERENCES character_item_instances(id)
        ON DELETE SET NULL,

    equipped_at TIMESTAMPTZ,

    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, slot_id)
);

CREATE INDEX idx_character_equipment_character
    ON character_equipment(character_id);


-- ============================================================
-- HISTORIQUE D'EQUIPEMENT
-- ============================================================

CREATE TABLE character_equipment_history (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    slot_id BIGINT NOT NULL
        REFERENCES equipment_slot_definitions(id)
        ON DELETE CASCADE,

    item_instance_id BIGINT
        REFERENCES character_item_instances(id)
        ON DELETE SET NULL,

    equipped_from TIMESTAMPTZ,
    equipped_until TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_history_character
    ON character_equipment_history(character_id, equipped_from);


INSERT INTO schema_migrations(version, description)
VALUES (
    '020_item_equipment_system',
    'Ajout des items, sources, instances possedees et equipement des personnages'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
