const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..");
const DOWNLOAD_DIR = path.join(PROJECT_ROOT, "public", "downloads");
const MANIFEST_PATH = path.join(DOWNLOAD_DIR, "AzerCompanionCollector.json");
const ZIP_FILENAME = "AzerCompanionCollector.zip";
const ZIP_PATH = path.join(DOWNLOAD_DIR, ZIP_FILENAME);
const TOC_PATH = path.join(
  PROJECT_ROOT,
  "wow-addon",
  "AzerCompanionCollector",
  "AzerCompanionCollector.toc",
);

function normalizeVersion(value) {
  const version = String(value || "").trim();
  return version || null;
}

function readTocVersion() {
  try {
    const toc = fs.readFileSync(TOC_PATH, "utf8");
    const match = toc.match(/^##\s*Version:\s*(.+)$/im);
    return normalizeVersion(match?.[1]);
  } catch (_error) {
    return null;
  }
}

function readManifest() {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const manifest = JSON.parse(raw);
    return manifest && typeof manifest === "object" ? manifest : {};
  } catch (_error) {
    return {};
  }
}

function getPublishedAddonRelease() {
  const manifest = readManifest();
  const version = normalizeVersion(manifest.version) || readTocVersion();
  const zipExists = fs.existsSync(ZIP_PATH);

  return {
    name: "Azer Companion Collector",
    version,
    downloadUrl: `/downloads/${ZIP_FILENAME}`,
    fileName: ZIP_FILENAME,
    sha256: normalizeVersion(manifest.sha256),
    size: Number.isFinite(Number(manifest.size)) ? Number(manifest.size) : null,
    publishedAt: normalizeVersion(manifest.publishedAt),
    available: Boolean(version && zipExists),
  };
}

function getAddonVersionState(installedVersion, publishedVersion) {
  const installed = normalizeVersion(installedVersion);
  const published = normalizeVersion(publishedVersion);

  if (!published) return "unavailable";
  if (!installed) return "missing";
  if (installed === published) return "current";
  return "outdated";
}

module.exports = {
  getAddonVersionState,
  getPublishedAddonRelease,
  normalizeVersion,
};
