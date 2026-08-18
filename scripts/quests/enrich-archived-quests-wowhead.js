#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const databasePath = path.join(root, "public/data/quests/quest-database.json");
const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const concurrency = Math.max(1, Math.min(20, Number(process.env.QUEST_ARCHIVE_CONCURRENCY || 10)));
const pending = Object.values(database.quests || {})
  .filter((quest) => !quest.description)
  .map((quest) => Number(quest.id))
  .filter(Boolean);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractQuestPage(html) {
  const title = decodeHtml(html.match(/<title>([\s\S]*?)\s+-\s+Quête\s+-\s+World of Warcraft<\/title>/i)?.[1]);
  const description = decodeHtml(
    html.match(/<h2[^>]*>Description<\/h2>([\s\S]*?)(?=<h2\b|<div class="pad3")/i)?.[1],
  );
  return { title, description };
}

function extractQuestTooltip(payload = {}) {
  const tooltip = String(payload.tooltip || "");
  const objectiveHtml = tooltip.match(
    /<table><tr><td><br\s*\/?>([\s\S]*?)(?:<br\s*\/?><br\s*\/?><span|<\/td>)/i,
  )?.[1] || "";
  return {
    title: decodeHtml(payload.name),
    objectiveText: decodeHtml(objectiveHtml),
  };
}

function save() {
  database.updatedAt = new Date().toISOString();
  const temporaryPath = `${databasePath}.archive.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.renameSync(temporaryPath, databasePath);
      return;
    } catch (error) {
      if (error.code !== "EPERM" || attempt === 5) {
        fs.copyFileSync(temporaryPath, databasePath);
        fs.unlinkSync(temporaryPath);
        return;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
    }
  }
}

async function fetchArchivedQuest(id) {
  const url = `https://nether.wowhead.com/tooltip/quest/${id}?dataEnv=1&locale=2`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 AzerCompanion/1.1 archive builder" },
    });
    if (response.status === 404) return null;
    if (response.ok) return extractQuestTooltip(await response.json());
    if (response.status !== 429 && response.status < 500) return null;
    await delay((attempt + 1) * 1000);
  }
  return null;
}

async function main() {
  let cursor = 0;
  let completed = 0;
  let enriched = 0;
  let missing = 0;

  async function worker() {
    while (cursor < pending.length) {
      const id = pending[cursor];
      cursor += 1;
      const page = await fetchArchivedQuest(id);
      if (page?.title || page?.description || page?.objectiveText) {
        database.quests[id] = {
          ...database.quests[id],
          title: page.title || database.quests[id].title || `Quête archivée #${id}`,
          objectiveText: page.objectiveText || database.quests[id].objectiveText || "",
          description: page.description || database.quests[id].description || page.objectiveText || "",
          archived: Boolean(database.quests[id].archived),
          archiveSource: "Wowhead FR tooltip",
        };
        enriched += 1;
      } else {
        missing += 1;
      }
      completed += 1;
      if (completed % 100 === 0) {
        save();
        console.log(`${completed}/${pending.length} — enrichies ${enriched}, sans archive ${missing}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  save();
  console.log(`Terminé : ${enriched} archives enrichies, ${missing} sans texte récupérable.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
