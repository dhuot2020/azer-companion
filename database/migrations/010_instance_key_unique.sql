BEGIN;

ALTER TABLE instance_definitions
    ALTER COLUMN instance_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_instance_definitions_instance_key
    ON instance_definitions(instance_key);

INSERT INTO schema_migrations(version, description)
VALUES (
    '010_instance_key_unique',
    'Ajout de la cle unique instance_key pour les definitions d instances'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
