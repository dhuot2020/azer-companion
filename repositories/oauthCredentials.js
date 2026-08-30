const { pool } = require("../config/db");
const {
  encryptSecret,
  decryptSecret,
} = require("../services/oauthCrypto");

async function saveOAuthCredentials({
  authIdentityId,
  token,
}, client = pool) {
  const accessTokenEncrypted = encryptSecret(token.access_token);

  const refreshTokenEncrypted = token.refresh_token
    ? encryptSecret(token.refresh_token)
    : null;

  const expiresIn = Number(token.expires_in || 0);

  const accessTokenExpiresAt = expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  const result = await client.query(
    `
      INSERT INTO user_oauth_credentials (
        auth_identity_id,
        access_token_encrypted,
        refresh_token_encrypted,
        token_type,
        scope,
        access_token_expires_at,
        last_refreshed_at,
        revoked_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NULL, NOW()
      )

      ON CONFLICT (auth_identity_id)
      DO UPDATE SET
        access_token_encrypted = EXCLUDED.access_token_encrypted,
        refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
        token_type = EXCLUDED.token_type,
        scope = EXCLUDED.scope,
        access_token_expires_at = EXCLUDED.access_token_expires_at,
        last_refreshed_at = NOW(),
        revoked_at = NULL,
        updated_at = NOW()

      RETURNING
        id,
        auth_identity_id,
        access_token_expires_at
    `,
    [
      authIdentityId,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      token.token_type || "bearer",
      token.scope || null,
      accessTokenExpiresAt,
    ]
  );

  return result.rows[0];
}

async function getActiveAccessTokenForUser(userId, client = pool) {
  const result = await client.query(
    `
      SELECT
        uoc.access_token_encrypted,
        uoc.access_token_expires_at
      FROM user_oauth_credentials uoc
      JOIN user_auth_identities uai
        ON uai.id = uoc.auth_identity_id
      JOIN auth_provider_definitions ap
        ON ap.id = uai.provider_id
      WHERE uai.user_id = $1
        AND ap.provider_key = 'battle-net'
        AND uoc.revoked_at IS NULL
      ORDER BY
        uai.last_login_at DESC NULLS LAST
      LIMIT 1
    `,
    [userId]
  );

  if (result.rowCount !== 1) {
    return null;
  }

  const row = result.rows[0];

  if (
    row.access_token_expires_at &&
    new Date(row.access_token_expires_at).getTime() <= Date.now()
  ) {
    return {
      expired: true,
      accessToken: null,
      expiresAt: row.access_token_expires_at,
    };
  }

  return {
    expired: false,
    accessToken: decryptSecret(row.access_token_encrypted),
    expiresAt: row.access_token_expires_at,
  };
}

module.exports = {
  saveOAuthCredentials,
  getActiveAccessTokenForUser,
};
