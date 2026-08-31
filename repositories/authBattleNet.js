const { pool } = require("../config/db");
const { withTransaction } = require("../lib/withTransaction");

async function findBattleNetIdentity({
  providerSubject,
  regionKey,
}, client = pool) {
  const result = await client.query(
    `
      SELECT
        uai.id AS auth_identity_id,
        uai.user_id,
        uai.provider_subject,
        uai.region_key,
        uai.display_name,
        uai.last_login_at,
        au.display_name AS user_display_name
      FROM user_auth_identities uai
      JOIN auth_provider_definitions ap
        ON ap.id = uai.provider_id
      JOIN app_users au
        ON au.id = uai.user_id
      WHERE ap.provider_key = 'battle-net'
        AND uai.provider_subject = $1
        AND COALESCE(uai.region_key, '') = COALESCE($2, '')
      LIMIT 1
    `,
    [providerSubject, regionKey || null]
  );

  return result.rows[0] || null;
}

async function getOrCreateBattleNetUser({
  providerSubject,
  regionKey,
  battleTag = null,
}) {
  return withTransaction(async (client) => {
    const providerResult = await client.query(
      `
        SELECT id
        FROM auth_provider_definitions
        WHERE provider_key = 'battle-net'
          AND is_active = TRUE
        LIMIT 1
      `
    );

    if (providerResult.rowCount !== 1) {
      throw new Error("Le fournisseur Battle.net n'est pas configure.");
    }

    const providerId = providerResult.rows[0].id;

    // Serialise deux callbacks OAuth concurrents pour une meme identite.
    // La contrainte UNIQUE reste la derniere ligne de defense, mais cette
    // serrure evite qu'ils creent chacun un app_user orphelin.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
      [String(providerSubject), String(regionKey || "")],
    );

    const existing = await client.query(
      `
        SELECT
          uai.id AS auth_identity_id,
          uai.user_id
        FROM user_auth_identities uai
        WHERE uai.provider_id = $1
          AND uai.provider_subject = $2
          AND COALESCE(uai.region_key, '') = COALESCE($3, '')
        LIMIT 1
      `,
      [providerId, providerSubject, regionKey || null]
    );

    if (existing.rowCount === 1) {
      const row = existing.rows[0];

      await client.query(
        `
          UPDATE user_auth_identities
          SET
            display_name = COALESCE($2, display_name),
            last_login_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `,
        [row.auth_identity_id, battleTag]
      );

      await client.query(
        `
          UPDATE app_users
          SET
            display_name = COALESCE($2, display_name),
            updated_at = NOW()
          WHERE id = $1
        `,
        [row.user_id, battleTag]
      );

      return {
        created: false,
        userId: row.user_id,
        authIdentityId: row.auth_identity_id,
      };
    }

    const userResult = await client.query(
      `
        INSERT INTO app_users (
          display_name
        )
        VALUES ($1)
        RETURNING id
      `,
      [battleTag || "Battle.net"]
    );

    const userId = userResult.rows[0].id;

    const identityResult = await client.query(
      `
        INSERT INTO user_auth_identities (
          user_id,
          provider_id,
          provider_subject,
          region_key,
          display_name,
          last_login_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `,
      [
        userId,
        providerId,
        providerSubject,
        regionKey || null,
        battleTag,
      ]
    );

    return {
      created: true,
      userId,
      authIdentityId: identityResult.rows[0].id,
    };
  });
}

module.exports = {
  findBattleNetIdentity,
  getOrCreateBattleNetUser,
};
