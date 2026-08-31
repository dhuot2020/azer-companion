const test = require("node:test");
const assert = require("node:assert/strict");
const { PostgresSessionStore } = require("../middleware/postgresSessionStore");

function callStore(method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (error, value) => (error ? reject(error) : resolve(value)));
  });
}

test("PostgresSessionStore isole les sessions par identifiant", async () => {
  const rows = new Map();
  const pool = {
    async query(sql, values = []) {
      if (/INSERT INTO app_http_sessions/.test(sql)) {
        rows.set(values[0], JSON.parse(values[1]));
        return { rows: [], rowCount: 1 };
      }
      if (/SELECT session_data/.test(sql)) {
        const value = rows.get(values[0]);
        return { rows: value ? [{ session_data: value }] : [], rowCount: value ? 1 : 0 };
      }
      if (/DELETE FROM app_http_sessions WHERE session_id/.test(sql)) {
        rows.delete(values[0]);
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
  };
  const store = new PostgresSessionStore({ pool, pruneIntervalMs: Infinity });

  await callStore(store.set.bind(store), "session-a", { userId: 101, cookie: {} });
  await callStore(store.set.bind(store), "session-b", { userId: 202, cookie: {} });

  assert.deepEqual(await callStore(store.get.bind(store), "session-a"), {
    userId: 101,
    cookie: {},
  });
  assert.deepEqual(await callStore(store.get.bind(store), "session-b"), {
    userId: 202,
    cookie: {},
  });

  await callStore(store.destroy.bind(store), "session-a");
  assert.equal(await callStore(store.get.bind(store), "session-a"), null);
  assert.equal((await callStore(store.get.bind(store), "session-b")).userId, 202);
});
