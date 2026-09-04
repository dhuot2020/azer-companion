const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { parseCollectorSource, readCollectorSummary } = require("../services/azerCollector");

test("readCollectorSummary signale un Collector indisponible si WoW est absent", async () => {
  const previousWowInstallPath = process.env.WOW_INSTALL_PATH;
  const previousCollectorFile = process.env.AZER_COLLECTOR_FILE;

  process.env.WOW_INSTALL_PATH = path.join(
    __dirname,
    "installation-wow-inexistante",
  );
  delete process.env.AZER_COLLECTOR_FILE;

  try {
    assert.deepEqual(await readCollectorSummary(), {
      available: false,
      characters: [],
    });
  } finally {
    if (previousWowInstallPath === undefined) {
      delete process.env.WOW_INSTALL_PATH;
    } else {
      process.env.WOW_INSTALL_PATH = previousWowInstallPath;
    }

    if (previousCollectorFile === undefined) {
      delete process.env.AZER_COLLECTOR_FILE;
    } else {
      process.env.AZER_COLLECTOR_FILE = previousCollectorFile;
    }
  }
});


test("parseCollectorSource expose la version de l'addon pour le suivi de mise à jour", () => {
  const source = 'AzerCompanionDB = { ["schemaVersion"] = 9, ["addonVersion"] = "3.0.0-alpha4", ["characters"] = {}, ["account"] = {}, ["sync"] = {} }';
  const summary = parseCollectorSource(source);

  assert.equal(summary.addonVersion, "3.0.0-alpha4");
  assert.equal(summary.collectorVersion, "3.0.0-alpha4");
  assert.equal(summary.payloadVersion, "9");
});
