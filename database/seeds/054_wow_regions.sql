-- ============================================================
-- 054 - REGIONS BATTLE.NET / WOW
-- ============================================================

INSERT INTO wow_region_definitions (
    region_key,
    region_name,
    locale_default,
    is_active
)
VALUES
    ('us', 'Amériques', 'en_US', TRUE),
    ('eu', 'Europe', 'en_GB', TRUE),
    ('kr', 'Corée', 'ko_KR', TRUE),
    ('tw', 'Taïwan', 'zh_TW', TRUE)
ON CONFLICT (region_key) DO UPDATE
SET
    region_name = EXCLUDED.region_name,
    locale_default = EXCLUDED.locale_default,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
