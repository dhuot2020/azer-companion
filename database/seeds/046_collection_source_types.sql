INSERT INTO collection_source_definitions
(source_key, source_name, sort_order)
VALUES
('drop','Butin',10),
('vendor','Marchand',20),
('quest','Quête',30),
('achievement','Haut fait',40),
('reputation','Réputation',50),
('profession','Profession',60),
('world-event','Évènement mondial',70),
('pet-battle','Combat de mascottes',80),
('wild-capture','Capture sauvage',90),
('promotion','Promotion',100),
('store','Boutique',110),
('trading-post','Comptoir',120),
('other','Autre',999)
ON CONFLICT (source_key) DO UPDATE SET
 source_name=EXCLUDED.source_name,
 sort_order=EXCLUDED.sort_order,
 updated_at=NOW();
