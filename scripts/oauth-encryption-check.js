require("dotenv").config();

const crypto = require("crypto");

const raw = process.env.OAUTH_ENCRYPTION_KEY;

console.log("\nAzer Compagnion - OAuth encryption check\n");

if (!raw) {
  console.log("[MISS] OAUTH_ENCRYPTION_KEY");
  process.exitCode = 1;
  return;
}

let key;

try {
  key = Buffer.from(raw, "base64");
} catch {
  console.log("[FAIL] OAUTH_ENCRYPTION_KEY Base64 invalide");
  process.exitCode = 1;
  return;
}

if (key.length !== 32) {
  console.log(
    `[FAIL] OAUTH_ENCRYPTION_KEY = ${key.length} octets; attendu = 32`
  );
  process.exitCode = 1;
  return;
}

console.log("[OK  ] OAUTH_ENCRYPTION_KEY");
console.log("[INFO] AES-256-GCM");
