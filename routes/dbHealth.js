const express = require("express");
const { pool } = require("../config/db");

const router = express.Router();

router.get("/health", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS server_time,
        (SELECT COUNT(*) FROM schema_migrations) AS migration_count
    `);

    if (process.env.NODE_ENV === "production") {
      return res.json({ ok: true });
    }

    return res.json({ ok: true, database: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
