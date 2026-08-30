INSERT INTO collector_data_domains(domain_key,domain_name,sort_order)
VALUES
('character','Personnage',10),
('quests','Quêtes',20),
('class-progress','Progression de classe',30),
('hunter-tames','Bestiaire Hunter',40),
('hunter-taming-skills','Compétences de domptage',50),
('professions','Professions',60),
('reputations','Réputations',70),
('instances','Instances et lockouts',80),
('boss-kills','Boss vaincus',90),
('mounts','Montures',100),
('pets','Mascottes',110),
('achievements','Hauts faits',120),
('equipment','Équipement',130)
ON CONFLICT(domain_key) DO UPDATE SET
 domain_name=EXCLUDED.domain_name,
 sort_order=EXCLUDED.sort_order,
 updated_at=NOW();
