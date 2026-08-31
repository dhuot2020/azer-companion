const { battleNetApiGet } = require("./battleNetProfileApi");

const SLOT_MAP = {
  HEAD: "head",
  NECK: "neck",
  SHOULDER: "shoulder",
  SHIRT: "shirt",
  CHEST: "chest",
  WAIST: "waist",
  LEGS: "legs",
  FEET: "feet",
  WRIST: "wrist",
  HANDS: "hands",
  FINGER_1: "finger1",
  FINGER_2: "finger2",
  TRINKET_1: "trinket1",
  TRINKET_2: "trinket2",
  BACK: "back",
  MAIN_HAND: "mainHand",
  OFF_HAND: "offHand",
  TABARD: "tabard",
};

const QUALITY_MAP = {
  POOR: 0,
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
  ARTIFACT: 6,
  HEIRLOOM: 7,
  WOW_TOKEN: 1,
};

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function qualityNumber(quality) {
  if (Number.isFinite(Number(quality))) return Number(quality);
  const key = String(quality?.type || quality?.name || quality || "").toUpperCase();
  return QUALITY_MAP[key] ?? 1;
}

function normalizeStats(stats = []) {
  const normalized = {};

  for (const stat of Array.isArray(stats) ? stats : []) {
    const key = String(stat?.type?.type || stat?.type || "").trim();
    if (!key) continue;
    normalized[key] = number(stat?.value);
  }

  return normalized;
}

function normalizeEquipmentItem(item = {}) {
  const itemId = number(item?.item?.id || item?.id);
  const level = number(item?.level?.value || item?.item_level || item?.level);

  return {
    equipped: Boolean(itemId),
    itemId,
    itemName: String(item?.name || item?.item?.name || "Objet equipe"),
    quality: qualityNumber(item?.quality),
    itemLevel: level,
    itemType: String(item?.item_class?.name || ""),
    itemSubType: String(item?.item_subclass?.name || ""),
    inventoryType: String(item?.inventory_type?.name || ""),
    bindType: number(item?.binding?.type),
    armor: number(item?.armor?.value),
    stats: normalizeStats(item?.stats),
    durabilityCurrent: number(item?.durability?.value),
    durabilityMax: number(item?.durability?.value),
    minLevel: number(item?.requirements?.level?.value),
    sellPrice: number(item?.sell_price?.value),
    tooltipLines: [],
  };
}

function normalizeBattleNetEquipment(payload = {}, character = {}) {
  const slots = {};
  const itemLevels = [];

  for (const item of Array.isArray(payload?.equipped_items) ? payload.equipped_items : []) {
    const slotType = String(item?.slot?.type || "").toUpperCase();
    const slotName = SLOT_MAP[slotType];
    if (!slotName) continue;

    const normalized = normalizeEquipmentItem(item);
    slots[slotName] = normalized;
    if (normalized.itemLevel > 0) itemLevels.push(normalized.itemLevel);
  }

  const calculatedItemLevel = itemLevels.length
    ? itemLevels.reduce((sum, value) => sum + value, 0) / itemLevels.length
    : 0;

  return {
    schemaVersion: 1,
    key: `${String(character.realm_slug || "").toLowerCase()}::${String(character.name || "").toLowerCase()}`,
    identity: {
      id: number(character.id),
      name: String(character.name || ""),
      realm: String(character.realm_slug || character.realm_name || ""),
    },
    equipment: {
      schemaVersion: 1,
      slots,
      equippedCount: Object.values(slots).filter((slot) => slot?.equipped).length,
      averageItemLevel: calculatedItemLevel,
      equippedItemLevel: calculatedItemLevel,
      pvpItemLevel: 0,
      calculatedItemLevel,
      capturedAt: Math.floor(Date.now() / 1000),
      source: "battle-net",
    },
  };
}

async function getBattleNetCharacterEquipment(character, accessToken) {
  const realmSlug = String(character?.realm_slug || "").trim().toLowerCase();
  const characterName = String(character?.name || "").trim().toLowerCase();

  if (!realmSlug || !characterName) {
    throw new Error("Identite du personnage incomplete pour Battle.net.");
  }

  const payload = await battleNetApiGet(
    `/profile/wow/character/${encodeURIComponent(realmSlug)}/${encodeURIComponent(characterName)}/equipment`,
    accessToken,
  );

  return normalizeBattleNetEquipment(payload, character);
}

module.exports = {
  getBattleNetCharacterEquipment,
  normalizeBattleNetEquipment,
};
