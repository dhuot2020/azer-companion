INSERT INTO wow_races (
    race_key,
    race_name,
    is_allied_race,
    is_playable
)
VALUES
    -- ========================================================
    -- RACES PRINCIPALES
    -- ========================================================

    ('human',           'Humain',                 FALSE, TRUE),
    ('dwarf',           'Nain',                   FALSE, TRUE),
    ('night-elf',       'Elfe de la nuit',        FALSE, TRUE),
    ('gnome',           'Gnome',                  FALSE, TRUE),
    ('draenei',         'Draeneï',                FALSE, TRUE),
    ('worgen',          'Worgen',                 FALSE, TRUE),

    ('orc',             'Orc',                    FALSE, TRUE),
    ('undead',          'Mort-vivant',            FALSE, TRUE),
    ('tauren',          'Tauren',                 FALSE, TRUE),
    ('troll',           'Troll',                  FALSE, TRUE),
    ('blood-elf',       'Elfe de sang',           FALSE, TRUE),
    ('goblin',          'Gobelin',                FALSE, TRUE),

    -- Races jouables dans les deux factions
    ('pandaren',        'Pandaren',               FALSE, TRUE),
    ('dracthyr',        'Dracthyr',               FALSE, TRUE),

    -- ========================================================
    -- RACES ALLIÉES
    -- ========================================================

    ('void-elf',        'Elfe du Vide',            TRUE, TRUE),
    ('lightforged',     'Draeneï sancteforge',    TRUE, TRUE),
    ('dark-iron-dwarf', 'Nain sombrefer',          TRUE, TRUE),
    ('kul-tiran',       'Kultirassien',            TRUE, TRUE),
    ('mechagnome',      'Mécagnome',               TRUE, TRUE),

    ('nightborne',      'Sacrenuit',               TRUE, TRUE),
    ('highmountain',    'Tauren de Haut-Roc',      TRUE, TRUE),
    ('maghar-orc',      'Orc mag''har',            TRUE, TRUE),
    ('zandalari',       'Troll zandalari',         TRUE, TRUE),
    ('vulpera',         'Vulpérin',                TRUE, TRUE),

    -- Races alliées disponibles pour Horde OU Alliance
    ('earthen',         'Terrestre',               TRUE, TRUE),
    ('haranir',         'Haranir',                 TRUE, TRUE)

ON CONFLICT (race_key) DO UPDATE
SET
    race_name = EXCLUDED.race_name,
    is_allied_race = EXCLUDED.is_allied_race,
    is_playable = EXCLUDED.is_playable,
    updated_at = NOW();