#!/usr/bin/env node
"use strict";

// Build-time reference importer. Azer Companion never requires ATT at runtime.
// Usage: node scripts/quests/import-att-reference.js <ATT Zones.lua>

const fs = require("node:fs");
const path = require("node:path");

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/quests/import-att-reference.js <Zones.lua>");
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, "../..");
const worldPath = path.join(projectRoot, "public/data/quests/world-catalog.json");
const questPath = path.join(projectRoot, "public/data/quests/quest-catalog.json");
const source = fs.readFileSync(path.resolve(sourcePath), "utf8");
const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
const previous = fs.existsSync(questPath)
  ? JSON.parse(fs.readFileSync(questPath, "utf8"))
  : { regions: {} };

function extractBalancedCall(input, start) {
  let parens = 0;
  let braces = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < input.length; index += 1) {
    const character = input[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "(") parens += 1;
    else if (character === ")") {
      parens -= 1;
      if (parens === 0 && braces === 0) return input.slice(start, index + 1);
    } else if (character === "{") braces += 1;
    else if (character === "}") braces -= 1;
  }
  throw new Error(`Bloc Lua non équilibré à l'offset ${start}.`);
}

function findMapBlocks(mapID) {
  if (!mapID) return [];
  const marker = `m(${mapID},{`;
  const blocks = [];
  let offset = 0;
  while ((offset = source.indexOf(marker, offset)) >= 0) {
    blocks.push(extractBalancedCall(source, offset));
    offset += marker.length;
  }
  return blocks;
}

function getQuestIds(blocks) {
  const ids = new Set();
  for (const block of blocks) {
    const matcher = /\bq\((\d+),\{/g;
    let match;
    while ((match = matcher.exec(block))) ids.add(Number(match[1]));
  }
  return [...ids].sort((left, right) => left - right);
}

const previousQuestById = new Map();
for (const region of Object.values(previous.regions || {})) {
  for (const quest of region.quests || []) {
    const id = Number(quest.id || 0);
    if (id) previousQuestById.set(id, quest);
  }
}

const regions = {};
const missingMaps = [];
let importedQuestLinks = 0;

for (const continent of world.continents || []) {
  for (const region of continent.regions || []) {
    const mapID = Number(region.mapID || 0);
    const blocks = findMapBlocks(mapID);
    const questIds = getQuestIds(blocks);
    if (mapID && !blocks.length) missingMaps.push(`${mapID} ${region.name}`);

    const quests = questIds.map((id) => ({
      ...(previousQuestById.get(id) || {}),
      id,
      continentName: continent.name,
      regionName: region.name,
      mapID,
      source: "ATT build-time reference",
    }));
    const key = `${continent.name}::${region.name}`;
    regions[key] = {
      continentName: continent.name,
      regionName: region.name,
      mapID,
      validationQuestTotal: quests.length,
      rawQuestRecords: quests.length,
      quests,
    };
    region.catalogQuestCount = quests.length;
    importedQuestLinks += quests.length;
  }
}

const catalog = {
  version: "1.0.0",
  updatedAt: new Date().toISOString(),
  sourcePolicy: "Build-time reference import; Azer Companion does not require All The Things at runtime.",
  regions,
};

fs.writeFileSync(questPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
fs.writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
console.log(`${Object.keys(regions).length} régions cataloguées, ${importedQuestLinks} associations de quêtes importées.`);
if (missingMaps.length) {
  console.warn(`${missingMaps.length} MapID absents de cette version ATT :`);
  missingMaps.forEach((label) => console.warn(`- ${label}`));
}
