const { pool } = require("../config/db");

/**
 * Retourne un utilisateur Azer Compagnion par ID.
 */
async function findUserById(userId, client = pool) {
  const result = await client.query(
    `
      SELECT
        id,
        email,
        display_name,
        is_active,
        created_at,
        updated_at
      FROM app_users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function userMayReadLocalCollector(userId, client = pool) {
  const boundUserId = String(process.env.LOCAL_COLLECTOR_USER_ID || "").trim();
  if (boundUserId) return boundUserId === String(userId);

  const result = await client.query(
    `
      SELECT COUNT(*)::integer AS active_user_count,
             MIN(id)::text AS only_user_id
      FROM app_users
      WHERE is_active = TRUE
    `,
  );
  const row = result.rows[0] || {};
  return row.active_user_count === 1 && row.only_user_id === String(userId);
}

/**
 * Cherche une identite OAuth Battle.net deja liee.
 */
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
        au.email,
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

module.exports = {
  findUserById,
  findBattleNetIdentity,
  userMayReadLocalCollector,
};
