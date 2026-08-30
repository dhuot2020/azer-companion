CREATE INDEX IF NOT EXISTS idx_account_mounts_user
    ON account_mounts(user_id);

CREATE INDEX IF NOT EXISTS idx_account_pet_instances_user
    ON account_pet_instances(user_id);

CREATE INDEX IF NOT EXISTS idx_account_pet_instances_pet
    ON account_pet_instances(pet_id);

CREATE INDEX IF NOT EXISTS idx_mount_sources_instance
    ON mount_acquisition_sources(instance_id);

CREATE INDEX IF NOT EXISTS idx_pet_sources_zone
    ON pet_acquisition_sources(zone_id);
