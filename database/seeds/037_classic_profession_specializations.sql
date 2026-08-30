-- ============================================================
-- 037 - SPECIALISATIONS DE PROFESSIONS CLASSIC
-- ============================================================

INSERT INTO profession_specialization_definitions (
    profession_id, specialization_key, specialization_name
)
SELECT p.id, v.specialization_key, v.specialization_name
FROM profession_definitions p
JOIN (
    VALUES
        ('blacksmithing', 'armorsmithing', 'Fabricant d’armures'),
        ('blacksmithing', 'weaponsmithing', 'Fabricant d’armes'),

        ('engineering', 'gnomish-engineering', 'Ingénierie gnome'),
        ('engineering', 'goblin-engineering', 'Ingénierie gobeline'),

        ('leatherworking', 'elemental-leatherworking', 'Travail du cuir élémentaire'),
        ('leatherworking', 'dragonscale-leatherworking', 'Travail du cuir tribal-draconique'),
        ('leatherworking', 'tribal-leatherworking', 'Travail du cuir tribal')
) AS v(profession_key, specialization_key, specialization_name)
    ON p.profession_key = v.profession_key
ON CONFLICT (profession_id, specialization_key) DO UPDATE
SET
    specialization_name = EXCLUDED.specialization_name,
    updated_at = NOW();


INSERT INTO wow_game_version_profession_specializations (
    game_version_id, specialization_id, is_available
)
SELECT gv.id, ps.id, TRUE
FROM wow_game_versions gv
CROSS JOIN profession_specialization_definitions ps
WHERE gv.game_key IN (
    'classic-era',
    'classic-hardcore',
    'classic-season-of-discovery',
    'classic-anniversary-tbc'
)
ON CONFLICT (game_version_id, specialization_id) DO UPDATE
SET is_available = TRUE,
    updated_at = NOW();
