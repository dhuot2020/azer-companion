BEGIN;

-- ============================================================
-- 008 - GEOGRAPHIE WOW : REGIONS / CONTINENTS
-- ============================================================

CREATE TABLE wow_world_regions (
    id BIGSERIAL PRIMARY KEY,
    region_key VARCHAR(100) NOT NULL UNIQUE,
    region_name VARCHAR(150) NOT NULL,
    region_type VARCHAR(30) NOT NULL DEFAULT 'continent',
    parent_region_id BIGINT REFERENCES wow_world_regions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wow_world_region_type CHECK (
        region_type IN ('world','continent','realm','plane','other')
    )
);

CREATE INDEX idx_wow_world_regions_parent
    ON wow_world_regions(parent_region_id);

ALTER TABLE wow_game_version_zones
    ADD COLUMN world_region_id BIGINT
        REFERENCES wow_world_regions(id)
        ON DELETE SET NULL;

CREATE INDEX idx_game_version_zones_region
    ON wow_game_version_zones(world_region_id);

INSERT INTO schema_migrations(version, description)
VALUES (
    '008_world_geography',
    'Ajout des regions et continents pour la geographie WoW'
);

COMMIT;
