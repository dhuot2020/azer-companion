-- ============================================================
-- 056 - TYPES DE FAVORIS
-- ============================================================

INSERT INTO user_favorite_types (
    favorite_type_key,
    favorite_type_name,
    sort_order
)
VALUES
    ('character', 'Personnage', 10),
    ('quest', 'Quête', 20),
    ('creature', 'Créature', 30),
    ('pet-family', 'Famille de familier', 40),
    ('mount', 'Monture', 50),
    ('pet', 'Mascotte', 60),
    ('instance', 'Instance', 70),
    ('boss', 'Boss', 80),
    ('reputation', 'Réputation', 90),
    ('profession', 'Profession', 100),
    ('achievement', 'Haut fait', 110),
    ('item', 'Objet', 120)
ON CONFLICT (favorite_type_key) DO UPDATE
SET favorite_type_name = EXCLUDED.favorite_type_name,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
