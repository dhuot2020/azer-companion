INSERT INTO reputation_rank_definitions
(rank_key, rank_name, rank_order, minimum_value, maximum_value)
VALUES
('hated','Haï',10,-42000,-6001),
('hostile','Hostile',20,-6000,-3001),
('unfriendly','Inamical',30,-3000,-1),
('neutral','Neutre',40,0,2999),
('friendly','Amical',50,3000,8999),
('honored','Honoré',60,9000,20999),
('revered','Révéré',70,21000,41999),
('exalted','Exalté',80,42000,42000)
ON CONFLICT (rank_key) DO UPDATE SET
 rank_name=EXCLUDED.rank_name, rank_order=EXCLUDED.rank_order,
 minimum_value=EXCLUDED.minimum_value, maximum_value=EXCLUDED.maximum_value,
 updated_at=NOW();
