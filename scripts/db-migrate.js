const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

const MIGRATIONS_DIR = path.join(
  __dirname,
  "..",
  "database",
  "migrations",
);

function migrationVersionFromFilename(filename) {
  return path.basename(filename, ".sql");
}

async function migrationTableExists(client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'schema_migrations'
    ) AS exists
  `);

  return result.rows[0]?.exists === true;
}

async function getAppliedVersions(client) {
  if (!(await migrationTableExists(client))) {
    return new Set();
  }

  const result = await client.query(`
    SELECT version
    FROM schema_migrations
    ORDER BY id
  `);

  return new Set(
    result.rows.map((row) => row.version),
  );
}

async function run() {
  const client = await pool.connect();

  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) =>
        /^\d+.*\.sql$/i.test(file),
      )
      .sort((a, b) =>
        a.localeCompare(
          b,
          undefined,
          { numeric: true },
        ),
      );

    const applied =
      await getAppliedVersions(client);

    console.log(
      "\nAzer Compagnion - migrations",
    );
    console.log(
      `Dossier : ${MIGRATIONS_DIR}`,
    );
    console.log(
      `Fichiers trouves : ${files.length}\n`,
    );

    let executed = 0;
    let skipped = 0;

    for (const file of files) {
      const version =
        migrationVersionFromFilename(file);

      if (applied.has(version)) {
        console.log(`[SKIP] ${version}`);
        skipped += 1;
        continue;
      }

      const fullPath =
        path.join(MIGRATIONS_DIR, file);

      const sql =
        fs.readFileSync(
          fullPath,
          "utf8",
        );

      console.log(`[RUN ] ${version}`);

      try {
        await client.query(sql);

        if (
          !(await migrationTableExists(client))
        ) {
          throw new Error(
            `La migration ${version} s'est executee, mais schema_migrations n'existe pas.`,
          );
        }

        const check =
          await client.query(
            `
              SELECT 1
              FROM schema_migrations
              WHERE version = $1
              LIMIT 1
            `,
            [version],
          );

        if (check.rowCount === 0) {
          throw new Error(
            `La migration ${version} s'est executee, mais elle n'a pas ajoute sa ligne dans schema_migrations.`,
          );
        }

        applied.add(version);
        executed += 1;

        console.log(
          `[ OK ] ${version}\n`,
        );
      } catch (error) {
        console.error(
          `\n[FAIL] ${version}`,
        );
        console.error(error.message);

        process.exitCode = 1;
        return;
      }
    }

    console.log("Termine.");
    console.log(
      `Executees : ${executed}`,
    );
    console.log(
      `Ignorees  : ${skipped}`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(
    "Erreur migration :",
    error,
  );

  process.exitCode = 1;
});
