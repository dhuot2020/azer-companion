INSERT INTO auth_provider_definitions(provider_key,provider_name,is_active)
VALUES ('battle-net','Battle.net',TRUE)
ON CONFLICT(provider_key) DO UPDATE SET
 provider_name=EXCLUDED.provider_name,
 is_active=EXCLUDED.is_active,
 updated_at=NOW();
