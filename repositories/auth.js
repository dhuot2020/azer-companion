const { pool } = require("../config/db");
const { withTransaction } = require("../lib/withTransaction");

/**
 * Cree un utilisateur + son identite Battle.net de facon atomique.
 *
 * IMPORTANT:
 * - Aucun mot de passe Battle.net n'entre dans Azer Compagnion.
 * - Les tokens OAuth ne sont PAS geres ici.
 * - Le stockage chiffre des tokens viendra dans le service OAuth.
 */
async function createUserWithBattleNetIdentity({
  email = null,
  userDisplayName,
  providerSubject,
  regionKey,
  battleNetDisplayName = null,
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

    if (providerResult.rowCount === 0) {
      throw new Error("Le fournisseur Battle.net n'est pas configure.");
    }

    const providerId = providerResult.rows[0].id;

    const existingResult = await client.query(
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

    if (existingResult.rowCount > 0) {
      return {
        created: false,
        userId: existingResult.rows[0].user_id,
        authIdentityId: existingResult.rows[0].auth_identity_id,
      };
    }

    const userResult = await client.query(
      `
        INSERT INTO app_users (
          email,
          display_name
        )
        VALUES ($1, $2)
        RETURNING id
      `,
      [email, userDisplayName]
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
        battleNetDisplayName,
      ]
    );

    return {
      created: true,
      userId,
      authIdentityId: identityResult.rows[0].id,
    };
  });
}

/**
 * Met a jour la derniere connexion Battle.net.
 */
async function touchBattleNetLogin({
  authIdentityId,
  displayName = null,
}, client = pool) {
  await client.query(
    `
      UPDATE user_auth_identities
      SET
        display_name = COALESCE($2, display_name),
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [authIdentityId, displayName]
  );
}

module.exports = {
  createUserWithBattleNetIdentity,
  touchBattleNetLogin,
};
