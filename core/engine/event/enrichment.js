function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value || "").trim();
}

function normalizeQuestId(quest) {
  return number(quest?.id || quest?.questID || quest?.questId);
}

function firstText(...values) {
  return values.map(text).find(Boolean) || "";
}

function normalizeMoney(rewards) {
  const raw = rewards?.money;
  if (raw && typeof raw === "object") {
    const copper = number(raw.copper || raw.totalCopper || raw.amount);
    return {
      copper,
      gold: number(raw.gold) || Math.floor(copper / 10000),
      silver: number(raw.silver) || Math.floor((copper % 10000) / 100),
      copperRemainder: number(raw.copperRemainder) || copper % 100,
    };
  }

  const copper = number(
    rewards?.moneyCopper || rewards?.copper || rewards?.rewardMoney || rewards?.money,
  );
  return {
    copper,
    gold: Math.floor(copper / 10000),
    silver: Math.floor((copper % 10000) / 100),
    copperRemainder: copper % 100,
  };
}

function normalizeRewardItem(item) {
  return {
    id: number(item?.itemID || item?.itemId || item?.id),
    name: firstText(item?.name, item?.itemName, item?.title),
    quantity: Math.max(1, number(item?.quantity || item?.count || item?.amount) || 1),
    quality: number(item?.quality || item?.qualityID || item?.qualityId),
    itemLevel: number(item?.itemLevel || item?.level || item?.ilvl),
    iconUrl: text(item?.iconUrl),
  };
}

function normalizeCurrency(currency) {
  return {
    id: number(currency?.currencyID || currency?.currencyId || currency?.id),
    name: firstText(currency?.name, currency?.currencyName, currency?.title),
    quantity: number(currency?.quantity || currency?.count || currency?.amount),
    iconUrl: text(currency?.iconUrl),
  };
}

function normalizeRewards(rewards) {
  if (!rewards || typeof rewards !== "object") return null;

  const items = Array.isArray(rewards.items)
    ? rewards.items.map(normalizeRewardItem).filter((item) => item.id || item.name)
    : [];
  const choices = Array.isArray(rewards.choices)
    ? rewards.choices.map(normalizeRewardItem).filter((item) => item.id || item.name)
    : [];
  const currencies = Array.isArray(rewards.currencies)
    ? rewards.currencies.map(normalizeCurrency).filter((item) => item.id || item.name)
    : [];
  const money = normalizeMoney(rewards);
  const experience = number(rewards.experience || rewards.xp || rewards.rewardXP);

  if (!items.length && !choices.length && !currencies.length && !money.copper && !experience) {
    return null;
  }

  return { experience, money, items, choices, currencies };
}

function normalizeQuestRecord(quest, character) {
  const questId = normalizeQuestId(quest);
  if (!questId) return null;

  const location = character?.location || character?.ase?.location || {};
  return {
    questId,
    title: firstText(quest?.title, quest?.name, quest?.questName),
    description: firstText(quest?.description, quest?.details),
    zone: firstText(quest?.zone, quest?.zoneName, quest?.mapName, location?.zone),
    subZone: firstText(quest?.subZone, quest?.subZoneName, location?.subZone),
    mapId: number(quest?.mapID || quest?.mapId || location?.mapId),
    level: number(quest?.level || quest?.questLevel),
    rewards: normalizeRewards(quest?.rewards),
    completedAt: number(
      quest?.completedAt || quest?.completedTimestamp || quest?.observedAt || quest?.timestamp,
    ),
  };
}

function buildQuestIndex(collectorCharacters = []) {
  const index = new Map();
  const listNames = [
    "completedObserved",
    "completedHistory",
    "completedAccountShared",
    "active",
  ];

  for (const character of collectorCharacters) {
    const characterKey = `${text(character?.realm).toLowerCase()}::${text(character?.name).toLowerCase()}`;
    for (const listName of listNames) {
      const quests = Array.isArray(character?.quests?.[listName])
        ? character.quests[listName]
        : [];
      for (const quest of quests) {
        const normalized = normalizeQuestRecord(quest, character);
        if (!normalized) continue;
        const exactKey = `${characterKey}:${normalized.questId}`;
        const globalKey = `*:${normalized.questId}`;
        const existing = index.get(exactKey);
        if (!existing || normalized.title || normalized.rewards) index.set(exactKey, normalized);
        const globalExisting = index.get(globalKey);
        if (!globalExisting || normalized.title || normalized.rewards) index.set(globalKey, normalized);
      }
    }
  }

  return index;
}

function enrichQuestCompletedEvent(event, questIndex) {
  const questId = number(event?.details?.questId);
  if (!questId) return event;

  const characterKey = text(event.characterKey).toLowerCase();
  const quest = questIndex.get(`${characterKey}:${questId}`) || questIndex.get(`*:${questId}`);
  if (!quest) {
    return {
      ...event,
      details: {
        ...event.details,
        title: `Quête #${questId}`,
        enrichmentStatus: "partial",
      },
    };
  }

  return {
    ...event,
    details: {
      ...event.details,
      title: quest.title || `Quête #${questId}`,
      description: quest.description,
      zone: quest.zone,
      subZone: quest.subZone,
      mapId: quest.mapId,
      questLevel: quest.level,
      rewards: quest.rewards,
      completedAt: quest.completedAt || event.timestamp,
      enrichmentStatus: quest.title ? "complete" : "partial",
    },
  };
}

function enrichEvent(event, context = {}) {
  if (!event || typeof event !== "object") return event;
  if (event.type === "QUEST_COMPLETED") {
    return enrichQuestCompletedEvent(event, context.questIndex || new Map());
  }
  return event;
}

module.exports = {
  buildQuestIndex,
  enrichEvent,
  normalizeQuestRecord,
};
