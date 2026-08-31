require("dotenv").config();

const { Pool } = require("pg");

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getSslOptions() {
  const enabled = String(process.env.DATABASE_SSL || "false").toLowerCase() === "true";
  if (!enabled) return false;
  return {
    rejectUnauthorized:
      String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false",
  };
}

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: parsePositiveInteger(process.env.DB_PORT, 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...connection,
  ssl: getSslOptions(),
  max: parsePositiveInteger(process.env.DB_POOL_MAX, 10),
  idleTimeoutMillis: parsePositiveInteger(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: parsePositiveInteger(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
});

pool.on("error", (err) => {
  console.error("Erreur PostgreSQL inattendue :", err);
});

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    console.log("PostgreSQL connecté :", result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error("Erreur connexion PostgreSQL :", error.message);
    return false;
  }
}

async function assertDatabaseReady() {
  const result = await pool.query(`
    SELECT
      to_regclass('public.app_http_sessions') IS NOT NULL AS has_session_table,
      EXISTS (
        SELECT 1
        FROM schema_migrations
        WHERE version = '025_postgresql_http_sessions'
      ) AS has_session_migration
  `);

  const state = result.rows[0] || {};
  if (!state.has_session_table || !state.has_session_migration) {
    throw new Error(
      "Base PostgreSQL incomplete. Executez npm run db:migrate avant le demarrage.",
    );
  }
}

module.exports = {
  pool,
  testConnection,
  assertDatabaseReady,
};
