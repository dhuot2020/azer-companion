BEGIN;

-- ============================================================
-- 009 - INSTANCES PAR VERSION DE WOW
-- ============================================================
-- instance_definitions garde l'identite globale d'un donjon/raid.
-- wow_game_version_instances contient sa disponibilite et ses
-- informations propres a une version du jeu.
-- ============================================================

CREATE TABLE wow_game_version_instances (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    instance_id BIGINT NOT NULL
        REFERENCES instance_definitions(id)
        ON DELETE CASCADE,

    expansion_id BIGINT
        REFERENCES wow_expansions(id)
        ON DELETE SET NULL,

    zone_id BIGINT
        REFERENCES wow_zones(id)
        ON DELETE SET NULL,

    version_instance_name VARCHAR(255),

    minimum_level INTEGER,
    maximum_level INTEGER,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_current_content BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, instance_id)
);

CREATE INDEX idx_game_version_instances_version
    ON wow_game_version_instances(game_version_id);

CREATE INDEX idx_game_version_instances_expansion
    ON wow_game_version_instances(expansion_id);

CREATE INDEX idx_game_version_instances_zone
    ON wow_game_version_instances(zone_id);

INSERT INTO schema_migrations(version, description)
VALUES (
    '009_game_version_instances',
    'Ajout des instances disponibles par version de World of Warcraft'
);

COMMIT;
