const { pool } = require("../config/db");

async function getLatestCollectorImportForUser(userId) {
  if (!userId) return null;

  const result = await pool.query(
    `
      SELECT
        id,
        user_id,
        character_id,
        collector_version,
        import_status,
        records_received,
        records_processed,
        records_failed,
        raw_payload,
        imported_at,
        payload_version,
        addon_version,
        processing_status,
        processing_started_at,
        processing_completed_at,
        payload_hash
      FROM collector_imports
      WHERE user_id = $1
        AND raw_payload IS NOT NULL
        AND import_status = 'success'
      ORDER BY imported_at DESC, id DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function readLatestCollectorSummaryForUser(userId) {
  const collectorImport = await getLatestCollectorImportForUser(userId);

  if (!collectorImport) {
    return {
      available: false,
      characters: [],
    };
  }

  const payload = collectorImport.raw_payload;

  if (!payload || typeof payload !== "object") {
    return {
      available: false,
      characters: [],
    };
  }

  return {
    ...payload,
    available: true,
    cloudImport: {
      id: collectorImport.id,
      importedAt: collectorImport.imported_at,
      collectorVersion: collectorImport.collector_version,
      payloadVersion: collectorImport.payload_version,
      addonVersion: collectorImport.addon_version,
    },
  };
}

module.exports = {
  getLatestCollectorImportForUser,
  readLatestCollectorSummaryForUser,
};
