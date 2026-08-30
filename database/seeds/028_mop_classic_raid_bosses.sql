BEGIN;

INSERT INTO boss_definitions (
    instance_id, boss_name, boss_order, metadata
)
SELECT v.instance_id, v.boss_name, v.boss_order, v.metadata
FROM instance_definitions i
CROSS JOIN LATERAL (
    VALUES
    (i.id, 'The Stone Guard', 1, '{}'::jsonb),
    (i.id, 'Feng the Accursed', 2, '{}'::jsonb),
    (i.id, 'Gara''jal the Spiritbinder', 3, '{}'::jsonb),
    (i.id, 'The Spirit Kings', 4, '{}'::jsonb),
    (i.id, 'Elegon', 5, '{}'::jsonb),
    (i.id, 'Will of the Emperor', 6, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'mogushan-vaults'
ON CONFLICT (instance_id, boss_name) DO UPDATE
SET boss_order = EXCLUDED.boss_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();


INSERT INTO boss_definitions (
    instance_id, boss_name, boss_order, metadata
)
SELECT v.instance_id, v.boss_name, v.boss_order, v.metadata
FROM instance_definitions i
CROSS JOIN LATERAL (
    VALUES
    (i.id, 'Imperial Vizier Zor''lok', 1, '{}'::jsonb),
    (i.id, 'Blade Lord Ta''yak', 2, '{}'::jsonb),
    (i.id, 'Garalon', 3, '{}'::jsonb),
    (i.id, 'Wind Lord Mel''jarak', 4, '{}'::jsonb),
    (i.id, 'Amber-Shaper Un''sok', 5, '{}'::jsonb),
    (i.id, 'Grand Empress Shek''zeer', 6, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'heart-of-fear'
ON CONFLICT (instance_id, boss_name) DO UPDATE
SET boss_order = EXCLUDED.boss_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();


INSERT INTO boss_definitions (
    instance_id, boss_name, boss_order, metadata
)
SELECT v.instance_id, v.boss_name, v.boss_order, v.metadata
FROM instance_definitions i
CROSS JOIN LATERAL (
    VALUES
    (i.id, 'Protectors of the Endless', 1, '{}'::jsonb),
    (i.id, 'Tsulong', 2, '{}'::jsonb),
    (i.id, 'Lei Shi', 3, '{}'::jsonb),
    (i.id, 'Sha of Fear', 4, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'terrace-of-endless-spring'
ON CONFLICT (instance_id, boss_name) DO UPDATE
SET boss_order = EXCLUDED.boss_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

COMMIT;