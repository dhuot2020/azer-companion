INSERT INTO wow_game_versions (
    game_key,
    game_name,
    game_family,
    expansion_key,
    is_current,
    is_active
)
VALUES
    (
        'retail-midnight',
        'World of Warcraft: Midnight',
        'retail',
        'midnight',
        TRUE,
        TRUE
    ),
    (
        'classic-era',
        'WoW Classic Era',
        'classic',
        'classic',
        TRUE,
        TRUE
    ),
    (
        'classic-hardcore',
        'WoW Classic Hardcore',
        'classic',
        'classic',
        TRUE,
        TRUE
    ),
    (
        'classic-anniversary-tbc',
        'The Burning Crusade Classic Anniversary Edition',
        'classic',
        'the-burning-crusade',
        TRUE,
        TRUE
    ),
    (
        'classic-mop',
        'Mists of Pandaria Classic',
        'classic',
        'mists-of-pandaria',
        TRUE,
        TRUE
    ),
    (
        'classic-season-of-discovery',
        'WoW Classic Season of Discovery',
        'classic',
        'classic',
        TRUE,
        TRUE
    )
ON CONFLICT (game_key) DO UPDATE
SET
    game_name = EXCLUDED.game_name,
    game_family = EXCLUDED.game_family,
    expansion_key = EXCLUDED.expansion_key,
    is_current = EXCLUDED.is_current,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();