const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const SEEDS_DIR = path.join(__dirname, '..', 'database', 'seeds');

async function run() {
  const files = fs
    .readdirSync(SEEDS_DIR)
    .filter((file) => /^\d+.*\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log(`\nAzer Compagnion - seeds`);
  console.log(`Dossier : ${SEEDS_DIR}`);
  console.log(`Fichiers trouves : ${files.length}\n`);

  const client = await pool.connect();

  try {
    for (const file of files) {
      const fullPath = path.join(SEEDS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      console.log(`[RUN ] ${file}`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`[ OK ] ${file}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[FAIL] ${file}`);
        console.error(error.message);
        process.exitCode = 1;
        return;
      }
    }

    console.log('Tous les seeds ont ete executes.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Erreur seeds :', error);
  process.exitCode = 1;
});
