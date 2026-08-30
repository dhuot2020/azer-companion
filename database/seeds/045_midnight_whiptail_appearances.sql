-- ============================================================
-- 045 - MIDNIGHT : PREMIER MODELE DE FAMILLE / APPARENCES
-- ============================================================

INSERT INTO creature_appearance_definitions (
    appearance_key,
    appearance_name,
    family_id,
    model_name,
    color_name
)
SELECT
    v.appearance_key,
    v.appearance_name,
    f.id,
    v.model_name,
    v.color_name
FROM hunter_pet_family_definitions f
JOIN (
    VALUES
        ('whiptail-shredclaw-amber-brown', 'Shredclaw ambré-brun', 'Shredclaw', 'Amber-Brown'),
        ('whiptail-shredclaw-blue', 'Shredclaw bleu', 'Shredclaw', 'Blue'),
        ('whiptail-shredclaw-orange', 'Shredclaw orange', 'Shredclaw', 'Orange'),
        ('whiptail-shredclaw-red-grey', 'Shredclaw rouge-gris', 'Shredclaw', 'Red-Grey'),
        ('whiptail-grimlynx-grey-white', 'Grimlynx gris et blanc rayé', 'Grimlynx', 'Grey & White Striped')
) AS v(appearance_key, appearance_name, model_name, color_name)
    ON f.family_key = 'whiptails'
ON CONFLICT (appearance_key) DO UPDATE
SET
    appearance_name = EXCLUDED.appearance_name,
    family_id = EXCLUDED.family_id,
    model_name = EXCLUDED.model_name,
    color_name = EXCLUDED.color_name,
    updated_at = NOW();
