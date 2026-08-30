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

module.exports = { getCharacterForUser };
