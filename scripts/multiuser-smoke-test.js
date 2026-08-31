const { pool } = require("../config/db");

async function run() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM app_users) AS users,
      (SELECT COUNT(*) FROM user_auth_identities) AS auth_identities,
      (SELECT COUNT(*) FROM wow_characters) AS characters,
      (SELECT COUNT(*) FROM user_character_access) AS character_access_rows,
      (SELECT COUNT(*) FROM auth_provider_definitions
       WHERE provider_key = 'battle-net'
         AND is_active = TRUE) AS battle_net_provider,
      (SELECT COUNT(*)
       FROM wow_characters wc
       LEFT JOIN user_character_access uca
         ON uca.character_id = wc.id
        AND uca.user_id = wc.user_id
        AND uca.access_level = 'owner'
        AND uca.revoked_at IS NULL
       WHERE uca.id IS NULL) AS characters_without_owner_access,
      (SELECT COUNT(*)
       FROM user_character_access uca
       JOIN wow_characters wc ON wc.id = uca.character_id
       WHERE uca.access_level = 'owner'
         AND uca.revoked_at IS NULL
         AND uca.user_id <> wc.user_id) AS foreign_owner_access,
      (SELECT COUNT(*)
       FROM (
         SELECT user_id
         FROM user_character_preferences
         WHERE is_default = TRUE
         GROUP BY user_id
         HAVING COUNT(*) > 1
       ) duplicates) AS duplicate_default_users,
      (SELECT COUNT(*) FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'app_http_sessions') AS http_session_table
  `);

  console.table(result.rows);

  if (Number(result.rows[0].battle_net_provider) !== 1) {
    throw new Error("Le fournisseur Battle.net devrait etre configure exactement une fois.");
  }

  for (const invariant of [
    "characters_without_owner_access",
    "foreign_owner_access",
    "duplicate_default_users",
  ]) {
    if (Number(result.rows[0][invariant]) !== 0) {
      throw new Error(`Invariant multiuser invalide: ${invariant}.`);
    }
  }

  if (Number(result.rows[0].http_session_table) !== 1) {
    throw new Error("La table PostgreSQL des sessions HTTP est absente.");
  }

  await pool.end();
}

run().catch(async (error) => {
  console.error("Erreur smoke test multiuser :", error);
  try { await pool.end(); } catch {}
  process.exitCode = 1;
});
