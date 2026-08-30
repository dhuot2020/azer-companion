BEGIN;

-- ============================================================
-- 014 - CLE UNIQUE DES REPUTATIONS
-- ============================================================

ALTER TABLE reputation_definitions
    ALTER COLUMN reputation_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
    ux_reputation_definitions_reputation_key
    ON reputation_definitions(reputation_key);

INSERT INTO schema_migrations (
    version,
    description
)
VALUES (
    '014_reputation_key_unique',
    'Ajout de la cle unique reputation_key pour les definitions de reputation'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;