const fs = require('fs');
const path = require('path');

const fallback = '/assets/home-hero-azeroth-sharp.jpg';
const continents = [
  ['Royaumes de l’Est', 'Classic', [
    'Bois de la Pénombre','Bois des Chants éternels','Bois des Pins-Argentés','Cap Strangleronce','Carmines','Clairières de Tirisfal','Contreforts de Hautebrande','Dun Morogh','Forêt d’Elwynn','Forêt des Pins-Argentés','Gorge des Vents brûlants','Hautes-terres Arathies','Hinterlands','Île de Haut-Soleil','Loch Modan','Maleterres de l’Est','Maleterres de l’Ouest','Marais des Chagrins','Marche de l’Ouest','Paluns','Steppes Ardentes','Terres Foudroyées','Terres ingrates','Tol Barad','Vallée de Strangleronce','Vallée des Frigères','Zul’Aman'
  ]],
  ['Kalimdor', 'Classic', [
    'Azshara','Berceau-de-l’Hiver','Cratère d’Un’Goro','Désolace','Durotar','Féralas','Gangrebois','Les Serres-Rocheuses','Marécage d’Âprefange','Mille pointes','Moonglade','Mulgore','Orneval','Rivage obscur','Silithus','Sombrivage','Tanaris','Teldrassil','Tarides du Nord','Tarides du Sud','Uldum','Val d’Ammen','Exodar','Mont Hyjal','Cavernes des Lamentations'
  ]],
  ['Outreterre', 'The Burning Crusade', [
    'Péninsule des Flammes infernales','Marécage de Zangar','Forêt de Terokkar','Nagrand','Les Tranchantes','Raz-de-Néant','Vallée d’Ombrelune','Shattrath'
  ]],
  ['Norfendre', 'Wrath of the Lich King', [
    'Toundra Boréenne','Fjord Hurlant','Désolation des dragons','Les Grisonnes','Zul’Drak','Bassin de Sholazar','Les pics Foudroyés','La Couronne de glace','Forêt du Chant de cristal','Joug-d’Hiver','Dalaran'
  ]],
  ['Pandarie', 'Mists of Pandaria', [
    'La forêt de Jade','Vallée des Quatre vents','Étendues sauvages de Krasarang','Sommet de Kun-Lai','Steppes de Tanglong','Terres de l’Angoisse','Val de l’Éternel printemps','Île du Tonnerre','Île des Géants','Île du Temps figé'
  ]],
  ['Draenor', 'Warlords of Draenor', [
    'Crête de Givrefeu','Vallée d’Ombrelune (Draenor)','Gorgrond','Talador','Flèches d’Arak','Nagrand (Draenor)','Jungle de Tanaan','A’shran'
  ]],
  ['Îles Brisées', 'Legion', [
    'Azsuna','Val’sharah','Haut-Roc','Tornheim','Suramar','Rivage Brisé','Argus','Krokuun','Étendues antoréennes','Mac’Aree','Dalaran (Îles Brisées)'
  ]],
  ['Kul Tiras', 'Battle for Azeroth', [
    'Rade de Tiragarde','Drustvar','Vallée Chantorage','Boralus','Mécagone'
  ]],
  ['Zandalar', 'Battle for Azeroth', [
    'Zuldazar','Nazmir','Vol’dun','Dazar’alor','Nazjatar'
  ]],
  ['Ombreterre', 'Shadowlands', [
    'Le Bastion','Maldraxxus','Sylvarden','Revendreth','L’Antre','Oribos','Korthia','Zereth Mortis'
  ]],
  ['Îles aux Dragons', 'Dragonflight', [
    'Rivages de l’Éveil','Plaines d’Ohn’ahra','Travée d’Azur','Thaldraszus','Confins Interdits','Grotte de Zaralek','Rêve d’émeraude'
  ]],
  ['Khaz Algar', 'The War Within', [
    'Île de Dorn','Les abîmes Retentissants','Sainte-Chute','Azj-Kahet','Dornogal','Île des Sirènes'
  ]],
  ['Quel’Thalas', 'Midnight', [
    'Bois des Chants éternels (Midnight)','Zul’Aman (Midnight)','Harandar','Voidstorm'
  ]],
];

const aliases = {
  'Bois des Chants éternels': ['Eversong Woods'],
  'Bois des Chants éternels (Midnight)': ['Eversong Woods (Midnight)','Bois des Chants éternels - Midnight'],
  'Zul’Aman (Midnight)': ['Zul\'Aman (Midnight)'],
  'Île de Dorn': ['Isle of Dorn'],
  'Les abîmes Retentissants': ['The Ringing Deeps','The Ringing Deep'],
  'Sainte-Chute': ['Hallowfall'],
  'Azj-Kahet': ['Azj-Kahet'],
  'Îles aux Dragons': ['Dragon Isles'],
  'Royaumes de l’Est': ['Eastern Kingdoms','Royaumes de l\'Est'],
  'Outreterre': ['Outland'],
  'Norfendre': ['Northrend'],
  'Ombreterre': ['Shadowlands'],
  'Îles Brisées': ['Broken Isles'],
  'Quel’Thalas': ["Quel'Thalas"],
};

const catalog = {
  version: '1.0.0',
  updatedAt: '2026-08-09',
  locale: 'fr-CA',
  description: 'Structure mondiale Azer Companion. Les totaux de quêtes sont calculés à partir du catalogue de quêtes importé.',
  continents: continents.map(([name, expansion, regions], continentIndex) => ({
    id: `continent-${continentIndex + 1}`,
    name,
    aliases: aliases[name] || [],
    expansion,
    order: continentIndex + 1,
    image: fallback,
    regions: regions.map((regionName, regionIndex) => ({
      id: `region-${continentIndex + 1}-${regionIndex + 1}`,
      name: regionName,
      aliases: aliases[regionName] || [],
      order: regionIndex + 1,
      image: fallback,
      catalogQuestCount: 0
    }))
  }))
};

const out = path.resolve(__dirname, '../../public/data/quests/world-catalog.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
console.log(`World catalog written: ${out}`);
console.log(`${catalog.continents.length} continents, ${catalog.continents.reduce((n, c) => n + c.regions.length, 0)} regions`);
