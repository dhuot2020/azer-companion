BEGIN;

-- ============================================================
-- 005 - ARBRES DE TALENTS CLASSIC
-- ============================================================

CREATE TABLE wow_talent_tree_definitions (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL
        REFERENCES wow_classes(id)
        ON DELETE CASCADE,

    tree_key VARCHAR(100) NOT NULL,
    tree_name VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(class_id, tree_key)
);


CREATE TABLE wow_game_version_talent_trees (
    id BIGSERIAL PRIMARY KEY,

    game_version_id BIGINT NOT NULL
        REFERENCES wow_game_versions(id)
        ON DELETE CASCADE,

    talent_tree_id BIGINT NOT NULL
        REFERENCES wow_talent_tree_definitions(id)
        ON DELETE CASCADE,

    version_tree_key VARCHAR(100),
    version_tree_name VARCHAR(150),

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(game_version_id, talent_tree_id)
);


CREATE INDEX idx_talent_trees_class
    ON wow_talent_tree_definitions(class_id);

CREATE INDEX idx_game_version_talent_trees_version
    ON wow_game_version_talent_trees(game_version_id);


INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '005_classic_talent_trees',
    'Ajout des arbres de talents pour les versions Classic'
);

COMMIT;