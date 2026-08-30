const { pool } = require('../config/db');

async function run() {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      version() AS postgres_version,
      NOW() AS server_time,
      (SELECT COUNT(*) FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE') AS table_count,
      (SELECT COUNT(*) FROM schema_migrations) AS migration_count
  `);

  console.table(result.rows);
  await pool.end();
}

run().catch(async (error) => {
  console.error('Erreur DB check :', error);
  try { await pool.end(); } catch {}
  process.exitCode = 1;
});
