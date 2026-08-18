const fs = require('fs');
const path = require('path');

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: node scripts/quests/import-quest-catalog.js <catalogue.json>');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '../..');
const databasePath = path.join(projectRoot, 'public/data/quests/quest-database.json');
const worldPath = path.join(projectRoot, 'public/data/quests/world-catalog.json');
const source = JSON.parse(fs.readFileSync(path.resolve(sourcePath), 'utf8'));
const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
const world = JSON.parse(fs.readFileSync(worldPath, 'utf8'));

const rows = Array.isArray(source)
  ? source
  : Array.isArray(source.quests)
    ? source.quests
    : source.quests && typeof source.quests === 'object'
      ? Object.values(source.quests)
      : Object.values(source || {});

const normalize = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’‘`]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('fr');

const regionLookup = new Map();
for (const continent of world.continents || []) {
  for (const region of continent.regions || []) {
    for (const alias of [region.name, ...(region.aliases || [])]) {
      regionLookup.set(normalize(alias), { continent, region });
    }
  }
}

let imported = 0;
let skipped = 0;
for (const raw of rows) {
  const id = Number(raw.id || raw.questID || raw.questId || 0);
  if (!id) { skipped += 1; continue; }
  const regionLabel = raw.regionName || raw.region || raw.mapName || raw.zoneName || raw.areaName || '';
  const match = regionLookup.get(normalize(regionLabel));
  const existing = database.quests[String(id)] || {};
  database.quests[String(id)] = {
    ...existing,
    ...raw,
    id,
    title: raw.title || raw.name || existing.title || `Quête #${id}`,
    continentName: raw.continentName || raw.continent || match?.continent?.name || existing.continentName || 'Azeroth',
    regionName: regionLabel || match?.region?.name || existing.regionName || existing.mapName || 'Historique non classé',
    mapName: raw.mapName || regionLabel || existing.mapName || match?.region?.name || '',
    source: raw.source || existing.source || 'Azer Companion Quest Catalog Import'
  };
  imported += 1;
}

database.version = '0.4.0';
database.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(databasePath, JSON.stringify(database, null, 2) + '\n');
console.log(`Imported: ${imported}; skipped: ${skipped}; total catalog quests: ${Object.keys(database.quests).length}`);
