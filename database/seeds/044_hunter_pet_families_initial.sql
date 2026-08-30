-- ============================================================
-- 044 - FAMILLES HUNTER INITIALES / CAS SPECIAUX VERIFIES
-- ============================================================
-- Ce seed ne tente PAS encore de charger les 61 familles Midnight.
-- Il pose les familles necessaires a nos mecanismes speciaux et
-- la nouvelle famille Midnight Whiptails. Le catalogue complet
-- sera injecte dans un pack de donnees dedie.

INSERT INTO hunter_pet_family_definitions (
    family_key,
    family_name
)
VALUES
    ('whiptails', 'Whiptails'),
    ('blood-beasts', 'Blood Beasts'),
    ('direhorns', 'Direhorns'),
    ('feathermanes', 'Feathermanes'),
    ('spirit-beasts', 'Spirit Beasts'),
    ('devilsaurs', 'Devilsaurs'),
    ('water-striders', 'Water Striders'),
    ('worms', 'Worms'),
    ('carapids', 'Carapids'),
    ('chimaeras', 'Chimaeras')
ON CONFLICT (family_key) DO UPDATE
SET family_name = EXCLUDED.family_name,
    updated_at = NOW();

INSERT INTO wow_game_version_pet_families (
    game_version_id,
    family_id,
    required_taming_skill_id,
    is_available,
    is_exotic,
    beast_mastery_only,
    minimum_hunter_level
)
SELECT
    gv.id,
    f.id,
    CASE
        WHEN f.family_key = 'blood-beasts'
            THEN (SELECT id FROM hunter_taming_skill_definitions WHERE skill_key='blood-beast-taming')
        WHEN f.family_key = 'direhorns'
            THEN (SELECT id FROM hunter_taming_skill_definitions WHERE skill_key='direhorn-taming')
        WHEN f.family_key = 'feathermanes'
            THEN (SELECT id FROM hunter_taming_skill_definitions WHERE skill_key='feathermane-taming')
        ELSE NULL
    END,
    TRUE,
    CASE WHEN f.family_key IN (
        'whiptails','spirit-beasts','devilsaurs','water-striders','worms','carapids','chimaeras'
    ) THEN TRUE ELSE FALSE END,
    CASE WHEN f.family_key IN (
        'whiptails','spirit-beasts','devilsaurs','water-striders','worms','carapids','chimaeras'
    ) THEN TRUE ELSE FALSE END,
    CASE WHEN f.family_key IN (
        'whiptails','spirit-beasts','devilsaurs','water-striders','worms','carapids','chimaeras'
    ) THEN 10 ELSE NULL END
FROM wow_game_versions gv
CROSS JOIN hunter_pet_family_definitions f
WHERE gv.game_key = 'retail-midnight'
ON CONFLICT (game_version_id, family_id) DO UPDATE
SET
    required_taming_skill_id = EXCLUDED.required_taming_skill_id,
    is_available = EXCLUDED.is_available,
    is_exotic = EXCLUDED.is_exotic,
    beast_mastery_only = EXCLUDED.beast_mastery_only,
    minimum_hunter_level = EXCLUDED.minimum_hunter_level,
    updated_at = NOW();
