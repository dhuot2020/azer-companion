const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const addonParent = path.join(root, "wow-addon");
const addonDir = path.join(addonParent, "AzerCompanionCollector");
const tocPath = path.join(addonDir, "AzerCompanionCollector.toc");
const outputDir = path.join(root, "public", "downloads");
const zipPath = path.join(outputDir, "AzerCompanionCollector.zip");
const manifestPath = path.join(outputDir, "AzerCompanionCollector.json");

function fail(message) {
  console.error(`[addon:release] ${message}`);
  process.exit(1);
}

function readVersion() {
  const toc = fs.readFileSync(tocPath, "utf8");
  const match = toc.match(/^##\s*Version:\s*(.+)$/im);
  if (!match) fail("Version introuvable dans le fichier .toc.");
  return match[1].trim();
}

function runZip() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.rmSync(zipPath, { force: true });

  if (process.platform === "win32") {
    const command = [
      "$ErrorActionPreference='Stop';",
      `Compress-Archive -Path '${addonDir.replace(/'/g, "''")}'`,
      `-DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
    ].join(" ");

    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-Command", command],
      { stdio: "inherit" },
    );

    if (result.status !== 0) fail("Compress-Archive a échoué.");
    return;
  }

  const result = spawnSync("zip", ["-qr", zipPath, "AzerCompanionCollector"], {
    cwd: addonParent,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    fail("La commande 'zip' est requise pour générer la distribution.");
  }
}

const version = readVersion();
runZip();

const bytes = fs.readFileSync(zipPath);
const manifest = {
  name: "Azer Companion Collector",
  version,
  fileName: path.basename(zipPath),
  size: bytes.length,
  sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  publishedAt: new Date().toISOString(),
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`[addon:release] Version ${version}`);
console.log(`[addon:release] ZIP: ${zipPath}`);
console.log(`[addon:release] SHA-256: ${manifest.sha256}`);
