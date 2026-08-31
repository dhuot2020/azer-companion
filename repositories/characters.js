const { pool } = require("../config/db");

/**
 * Retourne uniquement les personnages auxquels l'utilisateur a acces.
 */
async function listCharactersForUser(userId, client = pool) {
  const result = await client.query(
    `
      SELECT
        wc.id,
        wc.character_name AS name,
        wc.realm_name,
        wc.realm_name AS realm,
        wc.realm_slug,
        wc.region,
        wc.level,
        wc.faction,
        wc.gender,
        COALESCE(wr.race_name, wc.race_name) AS race_name,
        wc.race_id,
        wc.class_id,
        wcl.blizzard_class_id,
        wcl.blizzard_class_id AS "classId",
        wr.blizzard_race_id,
        wr.blizzard_race_id AS "raceId",
        wcl.class_name,
        wc.item_level,
        wc.average_item_level,
        wc.equipped_item_level,
        wc.blizzard_character_id,
        wc.last_profile_sync_at,
        uca.access_level,
        media.avatar_url AS "avatarUrl",
        media.portrait_url AS "portraitUrl",
        media.full_body_url AS "fullBodyUrl"
      FROM user_character_access uca
      JOIN wow_characters wc ON wc.id = uca.character_id
      LEFT JOIN wow_classes wcl ON wcl.id = wc.class_id
      LEFT JOIN wow_races wr ON wr.id = wc.race_id
      LEFT JOIN LATERAL (
        SELECT
          MAX(cm.media_url) FILTER (WHERE cm.media_type = 'avatar' AND cm.is_current) AS avatar_url,
          MAX(cm.media_url) FILTER (WHERE cm.media_type IN ('inset','portrait') AND cm.is_current) AS portrait_url,
          COALESCE(
            MAX(cm.media_url) FILTER (WHERE cm.media_type = 'main-raw' AND cm.is_current),
            MAX(cm.media_url) FILTER (WHERE cm.media_type = 'main' AND cm.is_current),
            MAX(cm.media_url) FILTER (WHERE cm.media_type = 'render' AND cm.is_current)
          ) AS full_body_url
        FROM character_media cm
        WHERE cm.character_id = wc.id
      ) media ON TRUE
      WHERE uca.user_id = $1
        AND uca.revoked_at IS NULL
      ORDER BY wc.level DESC NULLS LAST, wc.character_name, wc.realm_name
    `,
    [userId],
  );
  return result.rows;
}


/**
 * Verifie si l'utilisateur peut acceder a un personnage.
 */
async function userCanAccessCharacter({ userId, characterId }, client = pool) {
  const result = await client.query(
    `
      SELECT
        access_level
      FROM user_character_access

      WHERE user_id = $1
        AND character_id = $2
        AND revoked_at IS NULL

      LIMIT 1
    `,
    [userId, characterId],
  );

  return result.rows[0] || null;
}

/**
 * Donne ou restaure l'acces proprietaire au personnage.
 */
async function grantCharacterOwnerAccess(
  { userId, characterId },
  client = pool,
) {
  const result = await client.query(
    `
      INSERT INTO user_character_access (
        user_id,
        character_id,
        access_level
      )
      VALUES (
        $1,
        $2,
        'owner'
      )

      ON CONFLICT (
        user_id,
        character_id
      )

      DO UPDATE SET
        access_level = 'owner',
        revoked_at = NULL

      RETURNING
        id,
        user_id,
        character_id,
        access_level,
        revoked_at
    `,
    [userId, characterId],
  );

  return result.rows[0];
}

module.exports = {
  listCharactersForUser,
  userCanAccessCharacter,
  grantCharacterOwnerAccess,
};
