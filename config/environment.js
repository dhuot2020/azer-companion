"use strict";

function isProduction() {
  return String(process.env.NODE_ENV || "development").toLowerCase() === "production";
}

function getPort() {
  const port = Number.parseInt(process.env.PORT || "3030", 10);
  return Number.isFinite(port) && port > 0 ? port : 3030;
}

function requireProductionSecret(name, value, fallback) {
  if (value) return value;
  if (isProduction()) {
    throw new Error(`${name} est obligatoire en production.`);
  }
  return fallback;
}

function getSessionSecret() {
  return requireProductionSecret(
    "SESSION_SECRET",
    process.env.SESSION_SECRET,
    "azer-companion-dev",
  );
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    maxAge: 1000 * 60 * 60 * 8,
  };
}

function validateBattleNetConfig() {
  const required = [
    "BLIZZARD_CLIENT_ID",
    "BLIZZARD_CLIENT_SECRET",
    "BLIZZARD_REDIRECT_URI",
  ];
  const missing = required.filter((name) => !process.env[name]);
  return { ok: missing.length === 0, missing };
}

module.exports = {
  getPort,
  getSessionCookieOptions,
  getSessionSecret,
  isProduction,
  validateBattleNetConfig,
};
