const express = require("express");
const crypto = require("crypto");

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/requireAuth");
const { parseCollectorSource } = require("../services/azerCollector");

const router = express.Router();

const MAX_COLLECTOR_SIZE = 25 * 1024 * 1024;

router.get("/import", requireAuth, (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Import Collector Cloud</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 32px;">
        <h1>Import Azer Companion Collector</h1>

        <p>
          Sélectionne ton fichier
          <strong>AzerCompanionCollector.lua</strong>.
        </p>

        <input
          id="collectorFile"
          type="file"
          accept=".lua,text/plain,text/x-lua"
        >

        <button id="importButton" type="button">
          Importer
        </button>

        <pre id="result" style="margin-top: 24px; white-space: pre-wrap;"></pre>

        <script>
          const fileInput = document.getElementById("collectorFile");
          const button = document.getElementById("importButton");
          const result = document.getElementById("result");

          button.addEventListener("click", async () => {
            const file = fileInput.files[0];

            if (!file) {
              result.textContent = "Choisis d'abord le fichier Collector.";
              return;
            }

            button.disabled = true;
            result.textContent = "Import en cours...";

            try {
              const source = await file.text();

              const response = await fetch("/api/collector-cloud/import", {
                method: "POST",
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                },
                body: source
              });

              const payload = await response.json();

              result.textContent =
                JSON.stringify(payload, null, 2);
            } catch (error) {
              result.textContent =
                "Erreur : " + error.message;
            } finally {
              button.disabled = false;
            }
          });
        </script>
      </body>
    </html>
  `);
});

router.post(
  "/import",
  requireAuth,
  express.text({
    type: ["text/plain", "text/x-lua", "application/octet-stream"],
    limit: "25mb",
  }),
  async (req, res, next) => {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "AUTH_REQUIRED",
      });
    }

    try {
      const source =
        typeof req.body === "string" ? req.body : String(req.body || "");

      if (!source.trim()) {
        return res.status(400).json({
          ok: false,
          error: "COLLECTOR_EMPTY",
          message: "Le fichier Collector est vide.",
        });
      }

      if (Buffer.byteLength(source, "utf8") > MAX_COLLECTOR_SIZE) {
        return res.status(413).json({
          ok: false,
          error: "COLLECTOR_TOO_LARGE",
        });
      }

      // Même parseur que le Collector local.
      const summary = parseCollectorSource(source, {
        sourceUpdatedAt: Math.floor(Date.now() / 1000),
      });

      const payloadHash = crypto
        .createHash("sha256")
        .update(source, "utf8")
        .digest("hex");

      const characterCount = Array.isArray(summary.characters)
        ? summary.characters.length
        : 0;

      const result = await pool.query(
        `
          INSERT INTO collector_imports (
            user_id,
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
          )
          VALUES (
            $1,
            $2,
            'success',
            $3,
            $3,
            0,
            $4::jsonb,
            NOW(),
            $5,
            $6,
            'success',
            NOW(),
            NOW(),
            $7
          )
          RETURNING id, imported_at
        `,
        [
          userId,
          String(summary.sync?.collectorVersion || ""),
          characterCount,
          JSON.stringify(summary),
          String(summary.sync?.payloadVersion || ""),
          String(summary.sync?.addonVersion || ""),
          payloadHash,
        ],
      );

      return res.json({
        ok: true,
        importId: result.rows[0].id,
        importedAt: result.rows[0].imported_at,
        characters: characterCount,
        sourceUpdatedAt: summary.sourceUpdatedAt || 0,
      });
    } catch (error) {
      console.error("Import Collector Cloud impossible :", error);
      return next(error);
    }
  },
);

module.exports = router;
