require("dotenv").config();

const required = [
  "BATTLENET_CLIENT_ID",
  "BATTLENET_CLIENT_SECRET",
  "BATTLENET_REDIRECT_URI",
  "SESSION_SECRET",
];

let failed = false;

console.log("\nAzer Compagnion - Battle.net OAuth config\n");

for (const name of required) {
  const value = process.env[name];
  const present = typeof value === "string" && value.length > 0;

  console.log(`${present ? "[OK  ]" : "[MISS]"} ${name}`);

  if (!present) {
    failed = true;
  }
}

console.log(
  `[INFO] BATTLENET_REGION=${process.env.BATTLENET_REGION || "us"}`
);

console.log(
  `[INFO] BATTLENET_LOGIN_SUCCESS_URL=${process.env.BATTLENET_LOGIN_SUCCESS_URL || "/api/auth/me"}`
);

if (failed) {
  process.exitCode = 1;
}
