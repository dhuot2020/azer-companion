INSERT INTO wow_difficulty_definitions (
    difficulty_key, difficulty_name, content_type,
    is_keystone, is_legacy, sort_order
)
VALUES
    ('normal', 'Normal', 'both', FALSE, FALSE, 10),
    ('heroic', 'Héroïque', 'both', FALSE, FALSE, 20),
    ('mythic', 'Mythique', 'both', FALSE, FALSE, 30),
    ('mythic-plus', 'Mythique+', 'dungeon', TRUE, FALSE, 40),
    ('raid-finder', 'Outil Raids', 'raid', FALSE, FALSE, 50),
    ('challenge-mode', 'Mode Défi', 'dungeon', FALSE, TRUE, 60),
    ('normal-10', 'Normal 10 joueurs', 'raid', FALSE, TRUE, 70),
    ('normal-25', 'Normal 25 joueurs', 'raid', FALSE, TRUE, 80),
    ('heroic-10', 'Héroïque 10 joueurs', 'raid', FALSE, TRUE, 90),
    ('heroic-25', 'Héroïque 25 joueurs', 'raid', FALSE, TRUE, 100),
    ('legacy-raid', 'Raid classique', 'raid', FALSE, TRUE, 110)
ON CONFLICT (difficulty_key) DO UPDATE
SET difficulty_name = EXCLUDED.difficulty_name,
    content_type = EXCLUDED.content_type,
    is_keystone = EXCLUDED.is_keystone,
    is_legacy = EXCLUDED.is_legacy,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
