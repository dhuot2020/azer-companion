BEGIN;

INSERT INTO boss_definitions (
    instance_id, boss_name, boss_order, metadata
)
SELECT v.instance_id, v.boss_name, v.boss_order, v.metadata
FROM instance_definitions i
CROSS JOIN LATERAL (
    VALUES
    (i.id, 'Attumen the Huntsman', 1, '{}'::jsonb),
    (i.id, 'Moroes', 2, '{}'::jsonb),
    (i.id, 'Maiden of Virtue', 3, '{}'::jsonb),
    (i.id, 'Opera Event', 4, '{}'::jsonb),
    (i.id, 'The Curator', 5, '{}'::jsonb),
    (i.id, 'Terestian Illhoof', 6, '{}'::jsonb),
    (i.id, 'Shade of Aran', 7, '{}'::jsonb),
    (i.id, 'Netherspite', 8, '{}'::jsonb),
    (i.id, 'Chess Event', 9, '{}'::jsonb),
    (i.id, 'Prince Malchezaar', 10, '{}'::jsonb),
    (i.id, 'Nightbane', 11, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'karazhan'
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
    (i.id, 'High King Maulgar', 1, '{}'::jsonb),
    (i.id, 'Gruul the Dragonkiller', 2, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'gruuls-lair'
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
    (i.id, 'Magtheridon', 1, '{}'::jsonb)
) AS v(instance_id, boss_name, boss_order, metadata)
WHERE i.instance_key = 'magtheridons-lair'
ON CONFLICT (instance_id, boss_name) DO UPDATE
SET boss_order = EXCLUDED.boss_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

COMMIT;