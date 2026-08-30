INSERT INTO reputation_definitions (reputation_key, reputation_name)
VALUES
('silvermoon-court','Silvermoon Court'),
('blood-knights','Blood Knights'),
('farstriders','Farstriders'),
('magisters','Magisters'),
('sunreavers','Sunreavers'),
('harati','Hara''ti')
ON CONFLICT (reputation_key) DO UPDATE SET
 reputation_name=EXCLUDED.reputation_name, updated_at=NOW();

INSERT INTO wow_game_version_reputations
(game_version_id,reputation_id,expansion_id,reputation_system,is_account_wide,is_available,metadata)
SELECT gv.id,r.id,e.id,
 CASE
   WHEN r.reputation_key='silvermoon-court' THEN 'culture'
   WHEN r.reputation_key IN ('blood-knights','farstriders','magisters','sunreavers') THEN 'activity'
   ELSE 'culture'
 END,
 TRUE,TRUE,'{}'::jsonb
FROM wow_game_versions gv
JOIN wow_expansions e ON e.expansion_key='midnight'
JOIN reputation_definitions r ON r.reputation_key IN
 ('silvermoon-court','blood-knights','farstriders','magisters','sunreavers','harati')
WHERE gv.game_key='retail-midnight'
ON CONFLICT (game_version_id,reputation_id) DO UPDATE SET
 expansion_id=EXCLUDED.expansion_id,
 reputation_system=EXCLUDED.reputation_system,
 is_account_wide=EXCLUDED.is_account_wide,
 is_available=TRUE, updated_at=NOW();
