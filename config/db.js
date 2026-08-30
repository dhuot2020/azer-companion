require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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

module.exports = {
  pool,
  testConnection,
};
