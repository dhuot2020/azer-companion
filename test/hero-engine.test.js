const test = require("node:test");
const assert = require("node:assert/strict");

const { buildHero, normalizeSlot } = require("../core/engine/hero");

test("normalizeSlot conserve toutes les données utiles au tooltip", () => {
  const slot = normalizeSlot({
    slotID: 7,
    slotName: "legs",
    equipped: true,
    itemID: 234567,
    itemName: "Jambières de garde-œuf",
    quality: 3,
    itemLevel: 639,
    itemSubType: "Mailles",
    minLevel: 80,
    sellPrice: 49,
    bindType: 1,
    stats: {
      ITEM_MOD_STAMINA_SHORT: 1120,
      ITEM_MOD_AGILITY_INTELLECT_SHORT: 860,
      ITEM_MOD_HASTE_RATING_SHORT: 420,
      ITEM_MOD_VERSATILITY: 380,
    },
    tooltipLines: [
      {
        leftText: "Jambières de garde-œuf",
        leftColor: { r: 0, g: 0.44, b: 0.87, a: 1 },
      },
    ],
    durabilityCurrent: 120,
    durabilityMax: 120,
    droppedBy: "Melidrussa Chillworn",
    dropChance: 7.17,
  });

  assert.equal(slot.itemId, 234567);
  assert.equal(slot.stats.ITEM_MOD_STAMINA_SHORT, 1120);
  assert.equal(slot.tooltipLines[0].leftText, "Jambières de garde-œuf");
  assert.equal(slot.durabilityCurrent, 120);
  assert.equal(slot.durabilityMax, 120);
  assert.equal(slot.sourceName, "Melidrussa Chillworn");
  assert.equal(slot.dropChance, 7.17);
});

test("buildHero transmet l'équipement Collector normalisé", () => {
  const hero = buildHero({
    name: "Azeria",
    realm: "Khaz Modan",
    characterKey: "khaz-modan::azeria",
    collector: {
      equipment: {
        equippedCount: 1,
        slots: {
          legs: {
            equipped: true,
            itemID: 234567,
            stats: { ITEM_MOD_STAMINA_SHORT: 1120 },
            durabilityCurrent: 120,
            durabilityMax: 120,
          },
        },
      },
    },
  });

  assert.equal(hero.equipment.equippedCount, 1);
  assert.equal(hero.equipment.slots.legs.stats.ITEM_MOD_STAMINA_SHORT, 1120);
  assert.equal(hero.equipment.slots.legs.durabilityMax, 120);
});
