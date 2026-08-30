INSERT INTO security_event_types(event_type_key,event_type_name,severity)
VALUES
('login-success','Connexion réussie','info'),
('login-failed','Échec de connexion','warning'),
('logout','Déconnexion','info'),
('oauth-linked','Compte OAuth lié','info'),
('oauth-unlinked','Compte OAuth dissocié','warning'),
('oauth-refresh-failed','Échec de rafraîchissement OAuth','warning'),
('session-revoked','Session révoquée','warning'),
('access-denied','Accès refusé','warning'),
('suspicious-activity','Activité suspecte','critical')
ON CONFLICT(event_type_key) DO UPDATE SET
 event_type_name=EXCLUDED.event_type_name,
 severity=EXCLUDED.severity;
