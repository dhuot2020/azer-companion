const { pool } = require("../config/db");

async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erreur ROLLBACK PostgreSQL :", rollbackError);
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  withTransaction,
};
