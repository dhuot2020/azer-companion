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
         AND is_active = TRUE) AS battle_net_provider
  `);

  console.table(result.rows);

  if (Number(result.rows[0].battle_net_provider) !== 1) {
    throw new Error("Le fournisseur Battle.net devrait etre configure exactement une fois.");
  }

  await pool.end();
}

run().catch(async (error) => {
  console.error("Erreur smoke test multiuser :", error);
  try { await pool.end(); } catch {}
  process.exitCode = 1;
});
