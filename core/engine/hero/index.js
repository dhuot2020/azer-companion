function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return typeof value === "string" ? value : "";
}

function normalizeColor(color) {
  return color && typeof color === "object"
    ? {
        r: number(color.r),
        g: number(color.g),
        b: number(color.b),
        a: number(color.a),
      }
    : null;
}

function normalizeTooltipLine(line = {}) {
  return {
    leftText: text(line.leftText),
    rightText: text(line.rightText),
    leftColor: normalizeColor(line.leftColor),
    rightColor: normalizeColor(line.rightColor),
  };
}

function normalizeSlot(slot = {}) {
  return {
    slotId: number(slot.slotID || slot.slotId),
    slotName: text(slot.slotName),
    equipped: slot.equipped === true,
    itemId: number(slot.itemID || slot.itemId),
    itemLink: text(slot.itemLink),
    itemName: text(slot.itemName),
    quality: number(slot.quality),
    itemLevel: number(slot.itemLevel),
    itemType: text(slot.itemType),
    itemSubType: text(slot.itemSubType),
    equipLocation: text(slot.equipLocation),
    icon: number(slot.icon),
    minLevel: number(slot.minLevel),
    sellPrice: number(slot.sellPrice),
    bindType: number(slot.bindType),
    classId: number(slot.classID || slot.classId),
    subclassId: number(slot.subclassID || slot.subclassId),
    stackCount: number(slot.stackCount),
    stats: slot.stats && typeof slot.stats === "object" ? slot.stats : {},
    tooltipLines: Array.isArray(slot.tooltipLines)
      ? slot.tooltipLines
          .map(normalizeTooltipLine)
          .filter((line) => line.leftText || line.rightText)
      : [],
    durabilityCurrent: number(slot.durabilityCurrent),
    durabilityMax: number(slot.durabilityMax),
    sourceName: text(slot.sourceName || slot.droppedBy),
    dropChance: number(slot.dropChance),
    enchantId: number(slot.enchantID || slot.enchantId),
    gemIds: Array.isArray(slot.gemIDs || slot.gemIds)
      ? (slot.gemIDs || slot.gemIds).map(number).filter(Boolean)
      : [],
    bonusIds: Array.isArray(slot.bonusIDs || slot.bonusIds)
      ? (slot.bonusIDs || slot.bonusIds).map(number).filter(Boolean)
      : [],
    transmog:
      slot.transmog && typeof slot.transmog === "object"
        ? {
            baseSourceId: number(
              slot.transmog.baseSourceID || slot.transmog.baseSourceId,
            ),
            baseVisualId: number(
              slot.transmog.baseVisualID || slot.transmog.baseVisualId,
            ),
            appliedSourceId: number(
              slot.transmog.appliedSourceID || slot.transmog.appliedSourceId,
            ),
            appliedVisualId: number(
              slot.transmog.appliedVisualID || slot.transmog.appliedVisualId,
            ),
          }
        : null,
  };
}

function normalizeEquipment(equipment = {}) {
  const slots = Object.fromEntries(
    Object.entries(equipment.slots || {}).map(([name, slot]) => [
      name,
      normalizeSlot(slot),
    ]),
  );

  return {
    schemaVersion: number(equipment.schemaVersion) || 1,
    slots,
    equippedCount: number(equipment.equippedCount),
    averageItemLevel: number(equipment.averageItemLevel),
    equippedItemLevel: number(equipment.equippedItemLevel),
    pvpItemLevel: number(equipment.pvpItemLevel),
    calculatedItemLevel: number(equipment.calculatedItemLevel),
    capturedAt: number(equipment.capturedAt),
  };
}

function buildHero(character = {}) {
  const collector =
    character._collectorSource ||
    character.collectorSource ||
    character.collector ||
    {};
  const ase = character.ase || {};
  const appearance = ase.appearance || {};
  const equipment = normalizeEquipment(collector.equipment || {});

  return {
    schemaVersion: 1,
    key: text(ase.identityKey || character.characterKey),
    identity: {
      id: number(ase.identity?.id || character.id),
      guid: text(ase.identity?.guid || collector.guid),
      name: text(character.name),
      realm: text(character.realmSlug || character.realm),
      faction: text(appearance.faction || character.faction),
    },
    appearance: {
      raceId: number(appearance.raceId),
      raceName: text(appearance.raceName),
      raceSlug: text(appearance.raceSlug),
      classId: number(appearance.classId),
      className: text(appearance.className),
      classSlug: text(appearance.classSlug),
      gender: text(appearance.gender),
      displayId: number(appearance.displayId),
      portraitKey: text(appearance.portraitKey),
      portraitSlug: text(appearance.portraitSlug),
      customization: collector.appearance?.customization || null,
    },
    progression: {
      level: number(ase.progression?.level || character.level),
      money: number(ase.progression?.money),
    },
    media: ase.media || {},
    equipment,
    location: ase.location || null,
    activity: ase.activity || {},
    sources: ase.sources || {},
    updatedAt: Math.max(
      number(equipment.capturedAt),
      number(ase.activity?.lastSeenAt),
      number(collector.hero?.updatedAt),
    ),
  };
}

function buildHeroes(characters = []) {
  const heroes = characters.map(buildHero);
  return {
    heroes,
    summary: {
      total: heroes.length,
      withEquipment: heroes.filter((hero) => hero.equipment.equippedCount > 0)
        .length,
      withCollector: heroes.filter((hero) => hero.sources.collector === true)
        .length,
    },
  };
}

module.exports = { buildHero, buildHeroes, normalizeSlot };
