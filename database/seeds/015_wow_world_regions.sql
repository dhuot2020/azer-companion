-- ============================================================
-- 015 - REGIONS / CONTINENTS WOW
-- ============================================================

INSERT INTO wow_world_regions (region_key, region_name, region_type)
VALUES
    ('azeroth', 'Azeroth', 'world'),
    ('outland', 'Outreterre', 'plane'),
    ('draenor', 'Draenor', 'world'),
    ('shadowlands', 'Ombreterre', 'plane')
ON CONFLICT (region_key) DO UPDATE
SET region_name = EXCLUDED.region_name,
    region_type = EXCLUDED.region_type,
    updated_at = NOW();

INSERT INTO wow_world_regions
(region_key, region_name, region_type, parent_region_id)
SELECT v.region_key, v.region_name, v.region_type, p.id
FROM (
    VALUES
      ('eastern-kingdoms','Royaumes de l’Est','continent','azeroth'),
      ('kalimdor','Kalimdor','continent','azeroth'),
      ('northrend','Norfendre','continent','azeroth'),
      ('pandaria','Pandarie','continent','azeroth'),
      ('broken-isles','Îles Brisées','continent','azeroth'),
      ('kul-tiras','Kul Tiras','continent','azeroth'),
      ('zandalar','Zandalar','continent','azeroth'),
      ('dragon-isles','Îles aux Dragons','continent','azeroth'),
      ('khaz-algar','Khaz Algar','continent','azeroth')
) AS v(region_key, region_name, region_type, parent_key)
JOIN wow_world_regions p ON p.region_key = v.parent_key
ON CONFLICT (region_key) DO UPDATE
SET region_name = EXCLUDED.region_name,
    region_type = EXCLUDED.region_type,
    parent_region_id = EXCLUDED.parent_region_id,
    updated_at = NOW();
