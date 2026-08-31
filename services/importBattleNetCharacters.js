const { pool } = require("../config/db");
const { withTransaction } = require("../lib/withTransaction");
const {
  getActiveAccessTokenForUser,
} = require("../repositories/oauthCredentials");
const {
  getRetailAccountProfile,
  battleNetApiGet,
} = require("../services/battleNetProfileApi");

function flattenCharacters(profile) {
  const accounts = Array.isArray(profile?.wow_accounts)
    ? profile.wow_accounts
    : [];

  const characters = [];

  for (const account of accounts) {
    const list = Array.isArray(account?.characters) ? account.characters : [];

    for (const character of list) {
      characters.push(character);
    }
  }

  return characters;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return null;
}

async function getCharacterTableColumns(client) {
  const result = await client.query(
    `
      SELECT
        column_name,
        is_nullable,
        column_default,
        is_identity
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'wow_characters'
      ORDER BY ordinal_position
    `,
  );

  return result.rows;
}


async function saveCharacterMedia({ client, characterId, character, accessToken }) {
  const realmSlug = String(character?.realm?.slug || character?.realm_slug || "")
    .trim()
    .toLowerCase();
  const characterName = String(character?.name || "").trim().toLowerCase();

  if (!realmSlug || !characterName || !accessToken) return;

  let media;
  try {
    media = await battleNetApiGet(
      `/profile/wow/character/${encodeURIComponent(realmSlug)}/${encodeURIComponent(characterName)}/character-media`,
      accessToken,
    );
  } catch (error) {
    console.warn(
      `Media Battle.net indisponible pour ${character?.name}-${realmSlug}:`,
      error.message,
    );
    return;
  }

  const assets = Array.isArray(media?.assets) ? media.assets : [];
  const supportedTypes = new Set(["avatar", "inset", "main", "main-raw"]);

  await client.query(
    `UPDATE character_media SET is_current = FALSE, updated_at = NOW() WHERE character_id = $1`,
    [characterId],
  );

  for (const asset of assets) {
    const mediaType = String(asset?.key || "").toLowerCase();
    const mediaUrl = String(asset?.value || "").trim();
    if (!supportedTypes.has(mediaType) || !mediaUrl) continue;

    await client.query(
      `
        INSERT INTO character_media (
          character_id, media_type, media_url, source, is_current, fetched_at, metadata, updated_at
        )
        VALUES ($1, $2, $3, 'battle-net', TRUE, NOW(), $4::jsonb, NOW())
        ON CONFLICT (character_id, media_type, media_url)
        DO UPDATE SET
          is_current = TRUE,
          fetched_at = NOW(),
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `,
      [characterId, mediaType, mediaUrl, JSON.stringify({ blizzardCharacterId: character.id })],
    );
  }
}

async function importCharacter({ client, userId, character, gameVersionId, accessToken }) {
  const columns = await getCharacterTableColumns(client);
  const existingColumnNames = new Set(
    columns.map((column) => column.column_name),
  );

  const realm = character.realm || {};

  const playableClassId = firstDefined(
    character.playable_class?.id,
    character.playable_class_id,
  );

  const playableRaceId = firstDefined(
    character.playable_race?.id,
    character.playable_race_id,
  );

  let classId = null;
  let raceId = null;

  if (playableClassId != null) {
    const result = await client.query(
      `
        SELECT id
        FROM wow_classes
        WHERE blizzard_class_id = $1
        LIMIT 1
      `,
      [playableClassId],
    );

    classId = result.rows[0]?.id || null;
  }

  if (playableRaceId != null) {
    const result = await client.query(
      `
        SELECT id
        FROM wow_races
        WHERE blizzard_race_id = $1
        LIMIT 1
      `,
      [playableRaceId],
    );

    raceId = result.rows[0]?.id || null;
  }

  const valuesByColumn = {
    user_id: userId,

    blizzard_character_id: character.id,

    name: character.name,

    character_name: character.name,

    realm_name: firstDefined(realm.name, character.realm_name),

    realm_slug: firstDefined(realm.slug, character.realm_slug),

    region: String(process.env.BATTLENET_REGION || "us").toLowerCase(),

    level: character.level,

    game_version_id: gameVersionId,

    class_id: classId,

    race_id: raceId,

    faction: firstDefined(
      character.faction?.type,
      character.faction?.name,
      character.faction,
    ),

    gender: firstDefined(
      character.gender?.type,
      character.gender?.name,
      character.gender,
    ),

    last_profile_sync_at: new Date(),

    updated_at: new Date(),
  };
  const insertColumns = [];
  const insertValues = [];

  for (const [name, value] of Object.entries(valuesByColumn)) {
    if (existingColumnNames.has(name) && value !== undefined) {
      insertColumns.push(name);
      insertValues.push(value);
    }
  }

  const supportedRequired = new Set(["id", "created_at", ...insertColumns]);

  const unsupportedRequired = columns.filter((column) => {
    return (
      column.is_nullable === "NO" &&
      column.column_default == null &&
      column.is_identity !== "YES" &&
      !supportedRequired.has(column.column_name)
    );
  });

  if (unsupportedRequired.length > 0) {
    throw new Error(
      "wow_characters contient des colonnes obligatoires non gerees: " +
        unsupportedRequired.map((column) => column.column_name).join(", "),
    );
  }

  if (
    !existingColumnNames.has("region") ||
    !existingColumnNames.has("blizzard_character_id")
  ) {
    throw new Error(
      "wow_characters doit contenir region et blizzard_character_id.",
    );
  }

  const placeholders = insertValues.map((_, index) => `$${index + 1}`);

  const updateColumns = insertColumns.filter(
    (column) =>
      !["region", "blizzard_character_id", "created_at"].includes(column),
  );

  const updateSql = updateColumns
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(",\n        ");

  const sql = `
    INSERT INTO wow_characters (
      ${insertColumns.join(", ")}
    )
    VALUES (
      ${placeholders.join(", ")}
    )

    ON CONFLICT (region, blizzard_character_id)
      WHERE blizzard_character_id IS NOT NULL

    DO UPDATE SET
      ${updateSql}

    RETURNING
      id,
      character_name,
      realm_name,
      realm_slug,
      level,
      blizzard_character_id
  `;

  const characterResult = await client.query(sql, insertValues);

  const row = characterResult.rows[0];

  // Un personnage Battle.net ne peut avoir qu'un proprietaire OAuth actif.
  // Si Blizzard l'a transfere vers un autre compte, l'ancien acces proprietaire
  // ne doit pas survivre a l'upsert global de son identifiant Blizzard.
  await client.query(
    `
      UPDATE user_character_access
      SET revoked_at = NOW()
      WHERE character_id = $2
        AND user_id <> $1
        AND access_level = 'owner'
        AND revoked_at IS NULL
    `,
    [userId, row.id],
  );

  await saveCharacterMedia({
    client,
    characterId: row.id,
    character,
    accessToken,
  });

  await client.query(
    `
      INSERT INTO user_character_access (
        user_id,
        character_id,
        access_level
      )
      VALUES ($1, $2, 'owner')

      ON CONFLICT (user_id, character_id)
      DO UPDATE SET
        access_level = 'owner',
        revoked_at = NULL

      RETURNING id
    `,
    [userId, row.id],
  );

  return {
    id: row.id,
    name: row.character_name,
    realm_name: row.realm_name,
    realm_slug: row.realm_slug,
    level: row.level,
    blizzard_character_id: row.blizzard_character_id,
  };
}

async function importRetailCharactersForUser(userId) {
  const credential = await getActiveAccessTokenForUser(userId);

  if (!credential) {
    const error = new Error(
      "Aucun token Battle.net disponible. Reconnectez-vous avec Battle.net.",
    );
    error.code = "BATTLENET_REAUTH_REQUIRED";
    throw error;
  }

  if (credential.expired) {
    const error = new Error(
      "Le token Battle.net a expire. Reconnectez-vous avec Battle.net.",
    );
    error.code = "BATTLENET_REAUTH_REQUIRED";
    throw error;
  }

  const profile = await getRetailAccountProfile(credential.accessToken);

  const characters = flattenCharacters(profile);

  return withTransaction(async (client) => {
    const gameVersionResult = await client.query(
      `
        SELECT id
        FROM wow_game_versions
        WHERE game_key = 'retail-midnight'
        LIMIT 1
      `,
    );

    if (gameVersionResult.rowCount !== 1) {
      throw new Error(
        "La version retail-midnight est absente de wow_game_versions.",
      );
    }

    const gameVersionId = gameVersionResult.rows[0].id;

    const imported = [];

    for (const character of characters) {
      if (!character?.id || !character?.name) {
        continue;
      }

      imported.push(
        await importCharacter({
          client,
          userId,
          character,
          gameVersionId,
          accessToken: credential.accessToken,
        }),
      );
    }

    // Le roster courant de Blizzard est la source de verite. Les personnages
    // qui ne sont plus presents restent en base pour l'historique, mais ne
    // sont plus exposes a cet utilisateur.
    const importedCharacterIds = imported.map((character) => character.id);
    await client.query(
      `
        UPDATE user_character_access uca
        SET revoked_at = NOW()
        FROM wow_characters wc
        WHERE uca.character_id = wc.id
          AND uca.user_id = $1
          AND uca.access_level = 'owner'
          AND uca.revoked_at IS NULL
          AND wc.region = $2
          AND NOT (wc.id = ANY($3::bigint[]))
      `,
      [
        userId,
        String(process.env.BATTLENET_REGION || "us").toLowerCase(),
        importedCharacterIds,
      ],
    );

    return {
      received: characters.length,
      imported: imported.length,
      characters: imported,
    };
  });
}

module.exports = {
  importRetailCharactersForUser,
};
