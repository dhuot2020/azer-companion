const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

async function run() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+.*\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const result = await pool.query(`
    SELECT version, description, applied_at
    FROM schema_migrations
    ORDER BY id
  `);

  const applied = new Map(
    result.rows.map((row) => [row.version, row])
  );

  console.log('\nAzer Compagnion - statut migrations\n');

  for (const file of files) {
    const version = path.basename(file, '.sql');
    const row = applied.get(version);

    if (row) {
      console.log(`[OK  ] ${version} - ${row.applied_at.toISOString()}`);
    } else {
      console.log(`[TODO] ${version}`);
    }
  }

  const diskVersions = new Set(
    files.map((file) => path.basename(file, '.sql'))
  );

  const dbOnly = result.rows.filter(
    (row) => !diskVersions.has(row.version)
  );

  if (dbOnly.length) {
    console.log('\nMigrations presentes en BD mais absentes du dossier :');
    for (const row of dbOnly) {
      console.log(`[DB? ] ${row.version} - ${row.description || ''}`);
    }
  }

  await pool.end();
}

run().catch(async (error) => {
  console.error('Erreur statut migrations :', error);
  try { await pool.end(); } catch {}
  process.exitCode = 1;
});
