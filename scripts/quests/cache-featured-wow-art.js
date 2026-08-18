const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const assets = [
  ["continents/12.jpg", "https://warcraft.wiki.gg/images/Legion_Kalimdor_loading_screen.jpg?c7eeb3"],
  ["continents/13.jpg", "https://warcraft.wiki.gg/images/Legion_Eastern_Kingdoms_loading_screen.jpg?3337d1"],
  ["continents/101.jpg", "https://warcraft.wiki.gg/images/Cataclysm_Outland_loading_screen.jpg?9e3544"],
  ["continents/113.jpg", "https://warcraft.wiki.gg/images/Cataclysm_Northrend_loading_screen.jpg?fd5fa3"],
  ["continents/424.jpg", "https://warcraft.wiki.gg/images/Mists_of_Pandaria_Pandaria_loading_screen.jpg?1850a5"],
  ["continents/572.png", "https://warcraft.wiki.gg/images/Draenor_space.png?7f17b3"],
  ["continents/619.jpg", "https://warcraft.wiki.gg/images/Legion_Broken_Isles_loading_screen.jpg?9bc88c"],
  ["continents/876.jpg", "https://warcraft.wiki.gg/images/Kul_Tiras_loading_screen.jpg?42d8a1"],
  ["continents/875.jpg", "https://warcraft.wiki.gg/images/Zandalar_loading_screen.jpg?7f77ff"],
  ["continents/1550.jpg", "https://warcraft.wiki.gg/images/Shadowlands_loading_screen.jpg?a87dcf"],
  ["continents/1978.jpg", "https://warcraft.wiki.gg/images/Dragon_Isles_loading_screen.jpg?c04bbd"],
  ["continents/2274.jpg", "https://warcraft.wiki.gg/images/Khaz_Algar_loading_screen.jpg?d3eab5"],
  ["world/10-full.jpg", "https://warcraft.wiki.gg/images/WorldMap-Barrens.jpg?a2bbf8"],
];

async function main() {
  for (const [relativePath, url] of assets) {
    const destination = path.join(root, "public/assets/maps", relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const response = await fetch(url, { headers: { "User-Agent": "AzerCompanion/1.1 map asset cache" } });
    if (!response.ok) throw new Error(`${response.status} pour ${url}`);
    fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
    console.log(`${relativePath} (${fs.statSync(destination).size} octets)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
