BEGIN;

-- ============================================================
-- 006 - SEASON OF DISCOVERY : SYSTEME DE RUNES
-- ============================================================


-- ============================================================
-- EMPLACEMENTS DE RUNES
-- ============================================================
--
-- Exemple :
-- chest
-- gloves
-- legs
-- belt
-- boots
-- helm
-- bracers
-- cloak
-- ring
--
-- On les sépare des runes elles-mêmes car Blizzard peut
-- ajouter/modifier les emplacements indépendamment.
-- ============================================================

CREATE TABLE sod_rune_slots (
    id BIGSERIAL PRIMARY KEY,

    slot_key VARCHAR(50) NOT NULL UNIQUE,
    slot_name VARCHAR(100) NOT NULL,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- DEFINITIONS DES RUNES
-- ============================================================

CREATE TABLE sod_rune_definitions (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT
        REFERENCES wow_classes(id)
        ON DELETE CASCADE,

    rune_key VARCHAR(150) NOT NULL,
    rune_name VARCHAR(255) NOT NULL,

    rune_type VARCHAR(30) NOT NULL,
    -- class
    -- utility

    spell_id BIGINT,
    item_id BIGINT,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(class_id, rune_key)
);


ALTER TABLE sod_rune_definitions
    ADD CONSTRAINT chk_sod_rune_type
    CHECK (
        rune_type IN (
            'class',
            'utility'
        )
    );


CREATE INDEX idx_sod_runes_class
    ON sod_rune_definitions(class_id);

CREATE INDEX idx_sod_runes_type
    ON sod_rune_definitions(rune_type);


-- ============================================================
-- RUNES DISPONIBLES PAR VERSION / EMPLACEMENT
-- ============================================================
--
-- Même si aujourd'hui ces tables servent principalement à SoD,
-- on rattache explicitement la rune à wow_game_versions.
--
-- Cela évite de coder "SoD" en dur partout.
-- ============================================================

CREATE TABLE sod_game_version_runes (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    rune_id BIGINT NOT NULL
        REFERENCES sod_rune_definitions(id)
        ON DELETE CASCADE,

    slot_id BIGINT
        REFERENCES sod_rune_slots(id)
        ON DELETE SET NULL,

    phase_number INTEGER,

    minimum_level INTEGER,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, rune_id)
);


CREATE INDEX idx_sod_version_runes_version
    ON sod_game_version_runes(game_version_id);

CREATE INDEX idx_sod_version_runes_slot
    ON sod_game_version_runes(slot_id);


-- ============================================================
-- METHODES / DECOUVERTES DE RUNES
-- ============================================================
--
-- Une rune peut historiquement avoir eu une méthode précise
-- de découverte, puis devenir disponible chez un Rune Broker.
--
-- On ne met donc pas ces informations directement dans
-- sod_rune_definitions.
-- ============================================================

CREATE TABLE sod_rune_discoveries (
    id BIGSERIAL PRIMARY KEY,

    rune_id BIGINT NOT NULL
        REFERENCES sod_rune_definitions(id)
        ON DELETE CASCADE,

    discovery_key VARCHAR(150) NOT NULL,
    discovery_name VARCHAR(255),

    discovery_type VARCHAR(50),
    -- quest
    -- item
    -- npc
    -- world
    -- vendor
    -- shared
    -- other

    zone_name VARCHAR(150),

    coordinate_x NUMERIC(8,4),
    coordinate_y NUMERIC(8,4),

    quest_id BIGINT,
    npc_id BIGINT,
    item_id BIGINT,

    description TEXT,

    is_current_method BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(rune_id, discovery_key)
);


CREATE INDEX idx_sod_rune_discoveries_rune
    ON sod_rune_discoveries(rune_id);


-- ============================================================
-- RUNES CONNUES PAR PERSONNAGE
-- ============================================================

CREATE TABLE character_sod_runes (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    rune_id BIGINT NOT NULL
        REFERENCES sod_rune_definitions(id)
        ON DELETE CASCADE,

    is_known BOOLEAN NOT NULL DEFAULT FALSE,

    learned_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, rune_id)
);


CREATE INDEX idx_character_sod_runes_character
    ON character_sod_runes(character_id);

CREATE INDEX idx_character_sod_runes_known
    ON character_sod_runes(character_id, is_known);


-- ============================================================
-- PROGRESSION DES DECOUVERTES PAR PERSONNAGE
-- ============================================================
--
-- Séparée de character_sod_runes :
--
-- character_sod_runes
--     = le personnage connaît-il la rune ?
--
-- character_sod_rune_discoveries
--     = quelle découverte a-t-il accomplie ?
--
-- Utile car certaines découvertes peuvent être partagées,
-- remplacées ou simplifiées au fil de SoD.
-- ============================================================

CREATE TABLE character_sod_rune_discoveries (
    id BIGSERIAL PRIMARY KEY,

    character_id BIGINT NOT NULL
        REFERENCES wow_characters(id)
        ON DELETE CASCADE,

    discovery_id BIGINT NOT NULL
        REFERENCES sod_rune_discoveries(id)
        ON DELETE CASCADE,

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at TIMESTAMPTZ,

    source VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, discovery_id)
);


CREATE INDEX idx_character_sod_discoveries_character
    ON character_sod_rune_discoveries(character_id);


-- ============================================================
-- MIGRATION
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '006_sod_rune_system',
    'Ajout du systeme de runes et decouvertes Season of Discovery'
);

COMMIT;