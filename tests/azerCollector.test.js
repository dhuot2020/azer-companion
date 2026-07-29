const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { readCollectorSummary } = require("../services/azerCollector");

test("importe une session Azer Companion Collector", async () => {
  const previousCollectorFile = process.env.AZER_COLLECTOR_FILE;
  process.env.AZER_COLLECTOR_FILE = path.join(
    __dirname,
    "fixtures",
    "AzerCompanionCollector.lua",
  );

  try {
    const summary = await readCollectorSummary();
    const floralune = summary.characters[0];

    assert.equal(summary.available, true);
    assert.equal(floralune.name, "Floralune");
    assert.equal(floralune.realm, "Zul'jin");
    assert.equal(floralune.location.zone, "Île de Brume-Sang");
    assert.equal(floralune.location.subZone, "Guet du sang");
    assert.equal(floralune.location.mapId, 106);
    assert.equal(floralune.latestSession.durationSeconds, 70);
  } finally {
    if (previousCollectorFile === undefined) {
      delete process.env.AZER_COLLECTOR_FILE;
    } else {
      process.env.AZER_COLLECTOR_FILE = previousCollectorFile;
    }
  }
});
