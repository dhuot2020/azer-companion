-- ============================================================
-- 034 - DEFINITIONS GLOBALES DES PROFESSIONS
-- ============================================================

INSERT INTO profession_definitions (
    profession_key,
    profession_name
)
VALUES
    ('alchemy', 'Alchimie'),
    ('blacksmithing', 'Forge'),
    ('enchanting', 'Enchantement'),
    ('engineering', 'Ingénierie'),
    ('herbalism', 'Herboristerie'),
    ('inscription', 'Calligraphie'),
    ('jewelcrafting', 'Joaillerie'),
    ('leatherworking', 'Travail du cuir'),
    ('mining', 'Minage'),
    ('skinning', 'Dépeçage'),
    ('tailoring', 'Couture'),

    ('archaeology', 'Archéologie'),
    ('cooking', 'Cuisine'),
    ('first-aid', 'Secourisme'),
    ('fishing', 'Pêche')
ON CONFLICT (profession_key) DO UPDATE
SET
    profession_name = EXCLUDED.profession_name,
    updated_at = NOW();
