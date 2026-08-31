"use strict";

const session = require("express-session");

class PostgresSessionStore extends session.Store {
  constructor({ pool, ttlMs = 8 * 60 * 60 * 1000, pruneIntervalMs = 15 * 60 * 1000 }) {
    super();
    this.pool = pool;
    this.ttlMs = ttlMs;
    this.pruneIntervalMs = pruneIntervalMs;
    this.lastPruneAt = 0;
  }

  get(sid, callback) {
    this.pool.query(
      `
        SELECT session_data
        FROM app_http_sessions
        WHERE session_id = $1
          AND expires_at > NOW()
        LIMIT 1
      `,
      [sid],
    ).then((result) => {
      callback(null, result.rows[0]?.session_data || null);
    }).catch(callback);
  }

  set(sid, sessionData, callback = () => {}) {
    const expiresAt = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + this.ttlMs);

    this.pool.query(
      `
        INSERT INTO app_http_sessions (session_id, session_data, expires_at)
        VALUES ($1, $2::jsonb, $3)
        ON CONFLICT (session_id)
        DO UPDATE SET
          session_data = EXCLUDED.session_data,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
      `,
      [sid, JSON.stringify(sessionData), expiresAt],
    ).then(() => {
      callback(null);
      this.pruneExpiredSessions();
    }).catch(callback);
  }

  destroy(sid, callback = () => {}) {
    this.pool.query(
      "DELETE FROM app_http_sessions WHERE session_id = $1",
      [sid],
    ).then(() => callback(null)).catch(callback);
  }

  touch(sid, sessionData, callback = () => {}) {
    const expiresAt = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + this.ttlMs);

    this.pool.query(
      `
        UPDATE app_http_sessions
        SET expires_at = $2,
            updated_at = NOW()
        WHERE session_id = $1
      `,
      [sid, expiresAt],
    ).then(() => callback(null)).catch(callback);
  }

  pruneExpiredSessions() {
    const now = Date.now();
    if (now - this.lastPruneAt < this.pruneIntervalMs) return;
    this.lastPruneAt = now;
    this.pool.query(
      "DELETE FROM app_http_sessions WHERE expires_at <= NOW()",
    ).catch((error) => {
      console.warn("Nettoyage des sessions PostgreSQL impossible :", error.message);
    });
  }
}

module.exports = { PostgresSessionStore };
