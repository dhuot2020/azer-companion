BEGIN;

INSERT INTO boss_definitions (
    instance_id, boss_name, boss_order, metadata
)
SELECT v.instance_id, v.boss_name, v.boss_order, v.metadata
FROM instance_definitions i
CROSS JOIN LATERAL (
    VALUES
    (i.id, 'Imperator Averzian', 1, '{}'::jsonb),
    (i.id, 'Vorasius', 2, '{}'::jsonb),
    (i.id, 'Fallen-King Salhadaar', 3, '{}'::jsonb),
    (i.id, 'Vaelgor & Ezzorak', 4, '{}'::jsonb),
    (i.id, 'Lightblinded Vanguard', 5, '{}'::jsonb),
    (i.id, 'Crown of the Cosmos', 6, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'the-voidspire'
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
    (i.id, 'Chimaerus the Undreamt God', 1, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'the-dreamrift'
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
    (i.id, 'Belo''ren, Child of Al''ar', 1, '{}'::jsonb),
    (i.id, 'Midnight Falls', 2, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'march-on-queldanas'
ON CONFLICT (instance_id, boss_name) DO UPDATE
SET boss_order = EXCLUDED.boss_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

COMMIT;