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
    "BATTLENET_CLIENT_ID",
    "BATTLENET_CLIENT_SECRET",
    "BATTLENET_REDIRECT_URI",
  ];
  const missing = required.filter((name) => !process.env[name]);
  return { ok: missing.length === 0, missing };
}

function validateProductionConfig() {
  if (!isProduction()) return;

  const required = [
    "SESSION_SECRET",
    "OAUTH_ENCRYPTION_KEY",
    "BATTLENET_CLIENT_ID",
    "BATTLENET_CLIENT_SECRET",
    "BATTLENET_REDIRECT_URI",
  ];
  if (!process.env.DATABASE_URL) {
    required.push("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD");
  }

  const missing = required.filter((name) => !String(process.env[name] || "").trim());
  if (missing.length) {
    throw new Error(`Configuration production incomplete: ${missing.join(", ")}`);
  }

  let redirectUri;
  try {
    redirectUri = new URL(process.env.BATTLENET_REDIRECT_URI);
  } catch {
    throw new Error("BATTLENET_REDIRECT_URI doit etre une URL valide.");
  }
  if (redirectUri.protocol !== "https:") {
    throw new Error("BATTLENET_REDIRECT_URI doit utiliser HTTPS en production.");
  }

  const encryptionKey = Buffer.from(process.env.OAUTH_ENCRYPTION_KEY, "base64");
  if (encryptionKey.length !== 32) {
    throw new Error("OAUTH_ENCRYPTION_KEY doit contenir exactement 32 octets en Base64.");
  }

  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET doit contenir au moins 32 caracteres.");
  }
}

function getRegistrationMode() {
  const fallback = isProduction() ? "closed" : "open";
  const mode = String(process.env.REGISTRATION_MODE || fallback).trim().toLowerCase();
  return ["open", "allowlist", "closed"].includes(mode) ? mode : fallback;
}

function canRegisterBattleTag(battleTag) {
  const mode = getRegistrationMode();
  if (mode === "open") return true;
  if (mode === "closed") return false;

  const normalized = String(battleTag || "").trim().toLowerCase();
  const allowed = String(process.env.ALLOWED_BATTLETAGS || "")
    .split(/[;,\r\n]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(normalized) && allowed.includes(normalized);
}

module.exports = {
  getPort,
  getSessionCookieOptions,
  getSessionSecret,
  isProduction,
  validateBattleNetConfig,
  validateProductionConfig,
  getRegistrationMode,
  canRegisterBattleTag,
};
