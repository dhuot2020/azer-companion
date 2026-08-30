INSERT INTO reputation_definitions (reputation_key,reputation_name)
VALUES
('argent-dawn','Argent Dawn'),
('cenarion-circle','Cenarion Circle'),
('thorium-brotherhood','Thorium Brotherhood'),
('timbermaw-hold','Timbermaw Hold'),
('zandalar-tribe','Zandalar Tribe'),
('hydraxian-waterlords','Hydraxian Waterlords'),
('brood-of-nozdormu','Brood of Nozdormu')
ON CONFLICT (reputation_key) DO UPDATE SET
 reputation_name=EXCLUDED.reputation_name, updated_at=NOW();

INSERT INTO wow_game_version_reputations
(game_version_id,reputation_id,expansion_id,reputation_system,is_account_wide,is_available)
SELECT gv.id,r.id,e.id,'standing',FALSE,TRUE
FROM wow_game_versions gv
JOIN wow_expansions e ON e.expansion_key='world-of-warcraft'
JOIN reputation_definitions r ON r.reputation_key IN
 ('argent-dawn','cenarion-circle','thorium-brotherhood','timbermaw-hold',
  'zandalar-tribe','hydraxian-waterlords','brood-of-nozdormu')
WHERE gv.game_key IN ('classic-era','classic-hardcore','classic-season-of-discovery')
ON CONFLICT (game_version_id,reputation_id) DO UPDATE SET
 is_available=TRUE, updated_at=NOW();
