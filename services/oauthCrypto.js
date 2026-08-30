const crypto = require("crypto");

function getEncryptionKey() {
  const raw = process.env.OAUTH_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("OAUTH_ENCRYPTION_KEY manquant.");
  }

  const key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY doit etre une cle de 32 octets encodee en Base64."
    );
  }

  return key;
}

function encryptSecret(plainText) {
  if (plainText == null) {
    return null;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format binaire versionne:
  // 1 octet version + 12 IV + 16 TAG + ciphertext
  return Buffer.concat([
    Buffer.from([1]),
    iv,
    authTag,
    encrypted,
  ]);
}

function decryptSecret(payload) {
  if (!payload) {
    return null;
  }

  const buffer = Buffer.isBuffer(payload)
    ? payload
    : Buffer.from(payload);

  const version = buffer.readUInt8(0);

  if (version !== 1) {
    throw new Error(`Version de chiffrement OAuth inconnue: ${version}`);
  }

  const iv = buffer.subarray(1, 13);
  const authTag = buffer.subarray(13, 29);
  const encrypted = buffer.subarray(29);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = {
  encryptSecret,
  decryptSecret,
};
