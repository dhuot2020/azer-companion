BEGIN;

CREATE INDEX IF NOT EXISTS idx_user_character_access_user_active ON user_character_access(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_auth_identities_provider ON user_auth_identities(provider_id);
CREATE INDEX IF NOT EXISTS idx_security_events_occurred_at ON security_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_account_reputations_user ON account_reputations(user_id);
CREATE INDEX IF NOT EXISTS idx_account_achievements_user_completed ON account_achievements(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_account_quest_completions_user_quest ON account_quest_completions(user_id, quest_id);
CREATE INDEX IF NOT EXISTS idx_account_mounts_user_mount ON account_mounts(user_id, mount_id);
CREATE INDEX IF NOT EXISTS idx_account_pet_instances_user_pet ON account_pet_instances(user_id, pet_id);

CREATE INDEX IF NOT EXISTS idx_character_reputations_character ON character_reputations(character_id);
CREATE INDEX IF NOT EXISTS idx_character_quests_character ON character_quests(character_id);
CREATE INDEX IF NOT EXISTS idx_character_achievements_character ON character_achievements(character_id);
CREATE INDEX IF NOT EXISTS idx_character_tames_character ON character_tames(character_id);
CREATE INDEX IF NOT EXISTS idx_character_equipment_character_slot ON character_equipment(character_id, slot_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_instance_definitions_instance_key
 ON instance_definitions(instance_key);

CREATE UNIQUE INDEX IF NOT EXISTS ux_reputation_definitions_reputation_key
 ON reputation_definitions(reputation_key);

CREATE UNIQUE INDEX IF NOT EXISTS ux_profession_definitions_profession_key
 ON profession_definitions(profession_key);

-- mount_definitions n'a pas mount_key.
-- L'identifiant Blizzard est la cle externe stable disponible.
CREATE UNIQUE INDEX IF NOT EXISTS ux_mount_definitions_blizzard_mount_id
 ON mount_definitions(blizzard_mount_id)
 WHERE blizzard_mount_id IS NOT NULL;

-- pet_definitions n'a pas pet_key.
-- L'identifiant Blizzard stable disponible est blizzard_species_id.
CREATE UNIQUE INDEX IF NOT EXISTS ux_pet_definitions_blizzard_species_id
 ON pet_definitions(blizzard_species_id)
 WHERE blizzard_species_id IS NOT NULL;

INSERT INTO schema_migrations(version,description)
VALUES(
 '024_final_hardening',
 'Audit final: indexes, unicite des identifiants Blizzard et durcissement multiutilisateur'
)
ON CONFLICT(version) DO NOTHING;

COMMIT;
