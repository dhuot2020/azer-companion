function normalizeText(value) {
  return String(value ?? "").normalize("NFKC").trim();
}

function normalizeKeyPart(value) {
  return normalizeText(value).toLocaleLowerCase("fr-CA");
}

function buildIdentityKey(character = {}) {
  const realm = character.realmSlug || character.realm || character.identity?.realm || "";
  const name = character.name || character.identity?.name || "";
  return `${normalizeKeyPart(realm)}::${normalizeKeyPart(name)}`;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function newestTimestamp(...values) {
  return Math.max(0, ...values.map((value) => finiteNumber(value)));
}

module.exports = {
  normalizeText,
  normalizeKeyPart,
  buildIdentityKey,
  finiteNumber,
  newestTimestamp,
};
