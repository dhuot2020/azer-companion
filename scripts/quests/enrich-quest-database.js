#!/usr/bin/env node
"use strict";

require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const catalogPath = path.join(root, "public/data/quests/quest-catalog.json");
const databasePath = path.join(root, "public/data/quests/quest-database.json");
const region = String(process.env.BLIZZARD_REGION || "us").toLowerCase();
const requestedLocale = process.env.BLIZZARD_LOCALE || "fr_FR";
// Blizzard Game Data ne publie pas les champs localisés en fr_CA.
const locale = requestedLocale.toLowerCase() === "fr_ca" ? "fr_FR" : requestedLocale;
const concurrency = Math.max(1, Math.min(40, Number(process.env.QUEST_ENRICH_CONCURRENCY || 20)));

if (!process.env.BLIZZARD_CLIENT_ID || !process.env.BLIZZARD_CLIENT_SECRET) {
  throw new Error("BLIZZARD_CLIENT_ID et BLIZZARD_CLIENT_SECRET sont requis.");
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const database = fs.existsSync(databasePath)
  ? JSON.parse(fs.readFileSync(databasePath, "utf8"))
  : { version: "1.0.0", quests: {} };
database.quests ||= {};

const questIds = [...new Set(
  Object.values(catalog.regions || {})
    .flatMap((entry) => entry.quests || [])
    .map((quest) => Number(quest.id || 0))
    .filter(Boolean),
)].sort((left, right) => left - right);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function save() {
  database.version = "1.0.0";
  database.updatedAt = new Date().toISOString();
  const temporaryPath = `${databasePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.renameSync(temporaryPath, databasePath);
      return;
    } catch (error) {
      if (error.code !== "EPERM" || attempt === 5) {
        // Windows peut garder le fichier ouvert brièvement (indexation/antivirus).
        fs.copyFileSync(temporaryPath, databasePath);
        fs.unlinkSync(temporaryPath);
        return;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
    }
  }
}

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error(`OAuth Blizzard indisponible (${response.status}).`);
  return (await response.json()).access_token;
}

function normalizeNamedReward(entry = {}) {
  const value = entry.item || entry.currency || entry.reward || entry;
  return {
    id: Number(value.id || 0),
    name: value.name || "",
    quantity: Number(entry.quantity || entry.value || 1),
  };
}

function rewardList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((entry) => Array.isArray(entry) ? entry : [entry]);
}

function normalizeRewards(rewards = {}) {
  return {
    experience: Number(rewards.experience || 0),
    money: Number(rewards.money?.value || rewards.money || 0),
    items: rewardList(rewards.items).map(normalizeNamedReward),
    choices: rewardList(rewards.choose_one_of || rewards.choices).map(normalizeNamedReward),
    currencies: rewardList(rewards.currencies).map(normalizeNamedReward),
    reputations: rewardList(rewards.reputations).map((entry) => ({
      id: Number(entry.reward?.id || 0),
      name: entry.reward?.name || "",
      value: Number(entry.value || 0),
    })),
  };
}

async function fetchQuest(id, token) {
  const url = `https://${region}.api.blizzard.com/data/wow/quest/${id}`
    + `?namespace=static-${region}&locale=${encodeURIComponent(locale)}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "AzerCompanion/1.1 quest catalog builder",
      },
    });
    if (response.status === 404) return { status: 404 };
    if (response.ok) return { status: response.status, payload: await response.json() };
    if (response.status !== 429 && response.status < 500) {
      return { status: response.status };
    }
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await delay(Math.max(500, retryAfter * 1000, (attempt + 1) * 750));
  }
  return { status: 503 };
}

async function main() {
  const token = await getAccessToken();
  const pending = questIds.filter((id) => {
    const quest = database.quests[id];
    const localizedTitle = quest?.title && quest.title !== `Quête #${id}`;
    return !(quest?.blizzardStatus === 404 || (quest?.blizzardStatus === 200 && localizedTitle));
  });
  let cursor = 0;
  let completed = 0;
  let available = 0;
  let archived = 0;
  let failed = 0;

  async function worker() {
    while (cursor < pending.length) {
      const id = pending[cursor];
      cursor += 1;
      const result = await fetchQuest(id, token);
      const existing = database.quests[id] || { id };
      if (result.payload) {
        const quest = result.payload;
        database.quests[id] = {
          ...existing,
          id,
          title: quest.title || existing.title || `Quête #${id}`,
          description: quest.description || existing.description || "",
          mapName: quest.area?.name || existing.mapName || "",
          areaID: Number(quest.area?.id || existing.areaID || 0),
          level: Number(quest.requirements?.min_character_level || existing.level || 0),
          maxLevel: Number(quest.requirements?.max_character_level || existing.maxLevel || 0),
          faction: quest.requirements?.faction?.name || existing.faction || "",
          rewards: normalizeRewards(quest.rewards),
          source: "API Blizzard Game Data",
          blizzardStatus: 200,
          blizzardLocale: locale,
        };
        available += 1;
      } else if (result.status === 404) {
        database.quests[id] = {
          ...existing,
          id,
          archived: true,
          blizzardStatus: 404,
          source: existing.source || "Référence historique ATT",
        };
        archived += 1;
      } else {
        failed += 1;
      }
      completed += 1;
      if (completed % 250 === 0) {
        save();
        console.log(`${completed}/${pending.length} — disponibles ${available}, archivées ${archived}, erreurs ${failed}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  save();
  console.log(`Terminé : ${pending.length} vérifiées, ${available} disponibles, ${archived} archivées, ${failed} erreurs.`);
  console.log(`${questIds.length} QuestID uniques dans la base mondiale.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
