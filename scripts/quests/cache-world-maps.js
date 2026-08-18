const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "../..");
const catalogPath = path.join(projectRoot, "public/data/quests/world-catalog.json");
const outputDir = path.join(projectRoot, "public/assets/maps/world");
const cdpEndpoint = process.env.AZER_CDP;

if (!cdpEndpoint) {
  throw new Error("AZER_CDP doit contenir l'URL WebSocket DevTools d'un navigateur Chromium.");
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
let mapIds = [...new Set(
  (catalog.continents || []).flatMap((continent) => [
    Number(continent.mapID || 0),
    ...(continent.regions || []).map((region) => Number(region.mapID || 0)),
  ]).filter(Boolean),
)].sort((a, b) => a - b);
const requestedMapIds = String(process.env.WOW_MAP_IDS || "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter(Boolean);
if (requestedMapIds.length) mapIds = mapIds.filter((mapID) => requestedMapIds.includes(mapID));

fs.mkdirSync(outputDir, { recursive: true });

const socket = new WebSocket(cdpEndpoint);
const pending = new Map();
let nextId = 0;

socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const resolve = pending.get(message.id);
  if (resolve) {
    pending.delete(message.id);
    resolve(message);
  }
};

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

async function waitForRenderedMap(mapID) {
  let previousSignature = "";
  let stableFrames = 0;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const response = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const canvas = document.querySelector("canvas");
        if (!canvas || canvas.width < 100 || canvas.height < 100) return null;
        const context = canvas.getContext("2d");
        if (!context) return null;
        const width = canvas.width;
        const height = canvas.height;
        const sample = document.createElement("canvas");
        sample.width = 32;
        sample.height = 24;
        const sampleContext = sample.getContext("2d", { willReadFrequently: true });
        sampleContext.drawImage(canvas, 0, 0, sample.width, sample.height);
        const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
        let opaque = 0;
        let checksum = 0;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (pixels[offset + 3] > 0) opaque += 1;
          checksum = (checksum + pixels[offset] * 3 + pixels[offset + 1] * 5 + pixels[offset + 2] * 7 + pixels[offset + 3]) >>> 0;
        }
        return { width, height, opaque, checksum };
      })()`,
    });
    const state = response.result?.result?.value;
    if (state?.opaque > 32) {
      const signature = `${state.width}:${state.height}:${state.opaque}:${state.checksum}`;
      stableFrames = signature === previousSignature ? stableFrames + 1 : 0;
      previousSignature = signature;
      // Several identical frames are required: Wago paints the CASC tiles
      // asynchronously and the first non-empty canvas can still be incomplete.
      if (stableFrames >= 5) return;
    }
    await delay(350);
  }
  throw new Error(`La carte ${mapID} n'a pas ete rendue dans le delai imparti.`);
}

async function cacheMap(mapID, index) {
  const destination = path.join(outputDir, `${mapID}.webp`);
  if (process.env.FORCE_WOW_MAPS !== "1" && fs.existsSync(destination) && fs.statSync(destination).size > 10000) {
    console.log(`[${index + 1}/${mapIds.length}] ${mapID} deja presente`);
    return;
  }

  await send("Page.navigate", { url: `https://wago.tools/maps/worldmap/${mapID}` });
  await waitForRenderedMap(mapID);
  const exploredToggle = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const toggle = document.querySelector('input.form-checkbox[type="checkbox"]');
      if (!toggle) return false;
      if (!toggle.checked) toggle.click();
      return true;
    })()`,
  });
  if (exploredToggle.result?.result?.value) await delay(700);
  else await delay(350);
  // The exploration overlay starts a second asynchronous paint pass.
  await waitForRenderedMap(mapID);
  const response = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `document.querySelector("canvas").toDataURL("image/webp", 0.84)`,
  });
  const dataUrl = response.result?.result?.value || "";
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error(`Export WebP impossible pour la carte ${mapID}.`);
  fs.writeFileSync(destination, Buffer.from(encoded, "base64"));
  console.log(`[${index + 1}/${mapIds.length}] ${mapID} -> ${path.relative(projectRoot, destination)}`);
}

socket.onopen = async () => {
  try {
    await send("Runtime.enable");
    await send("Page.enable");
    for (let index = 0; index < mapIds.length; index += 1) {
      try {
        await cacheMap(mapIds[index], index);
      } catch (error) {
        console.warn(`[${index + 1}/${mapIds.length}] ${mapIds[index]} ignoree: ${error.message}`);
      }
    }
    console.log(`${mapIds.length} cartes WoW mises en cache.`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    socket.close();
  }
};
