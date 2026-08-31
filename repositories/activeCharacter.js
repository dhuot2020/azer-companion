const { pool } = require("../config/db");

async function getCharacterForUser(userId, characterId, client = pool) {
  const result = await client.query(
    `
      SELECT
        wc.id,
        wc.character_name AS name,
        wc.realm_name,
        wc.realm_slug,
        wc.level,
        wc.blizzard_character_id
      FROM wow_characters wc
      INNER JOIN user_character_access uca
        ON uca.character_id = wc.id
      WHERE uca.user_id = $1
        AND wc.id = $2
        AND uca.revoked_at IS NULL
      LIMIT 1
    `,
    [userId, characterId],
  );

  return result.rows[0] || null;
}

async function getDefaultCharacterForUser(userId, client = pool) {
  const result = await client.query(
    `
      SELECT
        wc.id,
        wc.character_name AS name,
        wc.realm_name,
        wc.realm_slug,
        wc.level,
        wc.blizzard_character_id
      FROM user_character_preferences ucp
      JOIN wow_characters wc
        ON wc.id = ucp.character_id
      JOIN user_character_access uca
        ON uca.user_id = ucp.user_id
       AND uca.character_id = ucp.character_id
       AND uca.revoked_at IS NULL
      WHERE ucp.user_id = $1
        AND ucp.is_default = TRUE
      ORDER BY ucp.updated_at DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function setDefaultCharacterForUser(userId, characterId, client = pool) {
  const character = await getCharacterForUser(userId, characterId, client);

  if (!character) {
    return null;
  }

  await client.query(
    `
      UPDATE user_character_preferences
      SET is_default = FALSE,
          updated_at = NOW()
      WHERE user_id = $1
        AND is_default = TRUE
        AND character_id <> $2
    `,
    [userId, characterId],
  );

  await client.query(
    `
      INSERT INTO user_character_preferences (
        user_id,
        character_id,
        is_default,
        updated_at
      )
      VALUES ($1, $2, TRUE, NOW())
      ON CONFLICT (user_id, character_id)
      DO UPDATE SET
        is_default = TRUE,
        updated_at = NOW()
    `,
    [userId, characterId],
  );

  return character;
}

module.exports = {
  getCharacterForUser,
  getDefaultCharacterForUser,
  setDefaultCharacterForUser,
};
