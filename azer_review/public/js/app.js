"use strict";

/*==========================================================
  SIDEBAR RETRACTABLE V0.5.2 - POIGNEE CENTRALE
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  const shell = document.querySelector(".azer-shell");
  const sidebar = document.getElementById("sideMenu");
  const handle = document.getElementById("sidebarHandle");
  const mobileButton = document.getElementById("mobileMenuButton");
  const desktopMedia = window.matchMedia("(min-width: 981px)");

  if (!shell || !sidebar || !handle) {
    return;
  }

  function renderSidebar(isCollapsed) {
    const desktopCollapsed = desktopMedia.matches && isCollapsed;
    const icon = handle.querySelector(".sidebar-handle-icon");

    shell.classList.toggle("sidebar-is-collapsed", desktopCollapsed);
    sidebar.classList.toggle("is-collapsed", desktopCollapsed);

    handle.setAttribute("aria-expanded", String(!desktopCollapsed));
    handle.setAttribute(
      "aria-label",
      desktopCollapsed ? "Ouvrir la navigation" : "Réduire la navigation",
    );

    if (icon) {
      icon.textContent = desktopCollapsed ? "›" : "‹";
    }
  }

  function closeMobileSidebar() {
    if (!desktopMedia.matches) {
      sidebar.classList.remove("is-open");
      mobileButton?.setAttribute("aria-expanded", "false");
    }
  }

  handle.addEventListener("click", () => {
    if (!desktopMedia.matches) {
      closeMobileSidebar();
      return;
    }

    const isCollapsed = shell.classList.contains("sidebar-is-collapsed");
    renderSidebar(!isCollapsed);
  });

  sidebar.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (desktopMedia.matches) {
        renderSidebar(true);
        return;
      }

      closeMobileSidebar();
    });
  });

  desktopMedia.addEventListener("change", () => {
    sidebar.classList.remove("is-open");
    renderSidebar(false);
  });

  renderSidebar(false);
});

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("mobileMenuButton");
  const menu = document.getElementById("sideMenu");

  if (!button || !menu) {
    return;
  }

  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});
/*==========================================================
  SIDEBAR NAVIGATION
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("mainNav");

  if (!nav) return;

  const items = [...nav.querySelectorAll(".nav-item")];

  let current = items.findIndex((item) => item.classList.contains("active"));

  if (current < 0) current = 0;

  function select(index) {
    index = Math.max(0, Math.min(index, items.length - 1));

    items.forEach((item) => item.classList.remove("active"));

    items[index].classList.add("active");

    items[index].focus({
      preventScroll: true,
    });

    current = index;
  }

  items.forEach((item, index) => {
    item.setAttribute("tabindex", "0");

    item.addEventListener("click", (e) => {
      e.preventDefault();

      select(index);
    });
  });

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;

    if (isTyping) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();

        select(current + 1);

        break;

      case "ArrowUp":
        e.preventDefault();

        select(current - 1);

        break;

      case "Home":
        e.preventDefault();

        select(0);

        break;

      case "End":
        e.preventDefault();

        select(items.length - 1);

        break;

      case "Enter":

      case " ":
        e.preventDefault();

        items[current].click();

        break;
    }
  });
});

/*==========================================================
  HERO V0.3.0 - AMBIANCE JOUR / NUIT
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero-area");
  const toggle = document.getElementById("heroTimeToggle");
  const icon = document.getElementById("heroTimeIcon");

  if (!hero || !toggle || !icon) {
    return;
  }

  const currentHour = new Date().getHours();
  let isDay = currentHour >= 7 && currentHour < 19;

  function renderHeroTime() {
    hero.classList.toggle("is-day", isDay);
    icon.textContent = isDay ? "☀" : "☾";
    toggle.setAttribute(
      "aria-label",
      isDay ? "Activer l’ambiance nocturne" : "Activer l’ambiance de jour",
    );
  }

  toggle.addEventListener("click", () => {
    isDay = !isDay;
    renderHeroTime();
  });

  renderHeroTime();
});

// ======================================================
// Vue Mes personnages
// ======================================================

const characterButton = document.getElementById("character-switch-button");
const charactersList = document.getElementById("characters-list");
const charactersSearchInput = document.getElementById(
  "characters-search-input",
);
const charactersCount = document.getElementById("characters-count");
const battleStatus = document.getElementById("battleStatus");
const battleStatusText = document.getElementById("battleStatusText");

let blizzardCharacters = [];
let collectorCharacters = new Map();
let currentFactionFilter = "all";
let profiledCharacter = null;
let profileImageMode = "portrait";
const selectedCharacterStorageKey = "azerCompanion.selectedCharacter";
let currentCharacterKey = readSelectedCharacterKey();

function getCharacterKey(character) {
  const realm = String(character?.realm || "")
    .trim()
    .toLowerCase();
  const name = String(character?.name || "")
    .trim()
    .toLowerCase();

  return `${realm}::${name}`;
}

function readSelectedCharacterKey() {
  try {
    return localStorage.getItem(selectedCharacterStorageKey) || "";
  } catch (error) {
    console.warn("Impossible de lire le personnage sélectionné.", error);
    return "";
  }
}

function saveSelectedCharacterKey(characterKey) {
  try {
    localStorage.setItem(selectedCharacterStorageKey, characterKey);
  } catch (error) {
    console.warn("Impossible de mémoriser le personnage sélectionné.", error);
  }
}

function isCurrentCharacter(character) {
  return (
    Boolean(currentCharacterKey) &&
    getCharacterKey(character) === currentCharacterKey
  );
}

function normalizeCollectorIdentity(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getCollectorCharacterKey(character) {
  return [
    normalizeCollectorIdentity(character?.realm),
    normalizeCollectorIdentity(character?.name),
  ].join("::");
}

async function loadCollectorCharacters() {
  try {
    const response = await fetch(`/api/collector?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Données du collecteur indisponibles.");
    }

    const data = await response.json();
    collectorCharacters = new Map(
      (data.characters || []).map((character) => [
        getCollectorCharacterKey(character),
        character,
      ]),
    );
  } catch (error) {
    collectorCharacters = new Map();
    console.warn("Impossible de charger Azer Companion Collector.", error);
  }
}

function getCollectorActivityTimestamp(character) {
  const timestamps = [
    character?.lastSeenAt,
    character?.lastLoginAt,
    character?.lastLogoutAt,
    character?.latestSession?.startedAt,
    character?.latestSession?.endedAt,
  ]
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  return timestamps.length ? Math.max(...timestamps) : 0;
}

function getLastCollectorCharacter() {
  const characters = [...collectorCharacters.values()]
    .filter((character) => character?.name && character?.realm)
    .map((character) => ({
      character,
      activityTimestamp: getCollectorActivityTimestamp(character),
    }))
    .sort(
      (firstCharacter, secondCharacter) =>
        secondCharacter.activityTimestamp - firstCharacter.activityTimestamp,
    );

  console.table(
    characters.map(({ character, activityTimestamp }) => ({
      personnage: character.name,
      royaume: character.realm,
      lastSeenAt: Number(character.lastSeenAt || 0),
      lastLoginAt: Number(character.lastLoginAt || 0),
      lastLogoutAt: Number(character.lastLogoutAt || 0),
      sessionStartedAt: Number(character.latestSession?.startedAt || 0),
      sessionEndedAt: Number(character.latestSession?.endedAt || 0),
      dateRetenue: activityTimestamp
        ? new Date(activityTimestamp * 1000).toLocaleString("fr-CA")
        : "Aucune date",
    })),
  );

  return characters[0]?.character || null;
}

function findBattleNetCharacterFromCollector(characters = []) {
  const lastCollectorCharacter = getLastCollectorCharacter();

  if (!lastCollectorCharacter) {
    console.warn("Aucun dernier personnage trouvé dans le collecteur.");
    return null;
  }

  const collectorKey = getCollectorCharacterKey(lastCollectorCharacter);
  const collectorName = normalizeCollectorIdentity(lastCollectorCharacter.name);

  const exactMatch = characters.find(
    (character) => getCollectorCharacterKey(character) === collectorKey,
  );

  const nameMatch = characters.find(
    (character) =>
      normalizeCollectorIdentity(character?.name) === collectorName,
  );

  const matchedCharacter = exactMatch || nameMatch || null;

  console.info("Azer Collector - dernier personnage :", {
    collector: lastCollectorCharacter,
    collectorKey,
    matchedCharacter,
  });

  return matchedCharacter;
}

function formatCollectorDuration(durationSeconds) {
  const totalSeconds = Math.max(0, Math.round(Number(durationSeconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  if (!hours && seconds) parts.push(`${seconds} s`);

  return parts.join(" ") || "moins d’une minute";
}

function formatCollectorClock(timestamp) {
  if (!timestamp) return "";

  return new Intl.DateTimeFormat("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function renderSidebarLastSession(character) {
  const container = document.getElementById("sidebar-last-session");
  const locationElement = document.getElementById(
    "sidebar-last-session-location",
  );
  const timeElement = document.getElementById("sidebar-last-session-time");
  const collectorCharacter = collectorCharacters.get(
    getCollectorCharacterKey(character),
  );
  const session = collectorCharacter?.latestSession;

  if (!container || !locationElement || !timeElement) return;

  if (!session?.startedAt) {
    container.hidden = true;
    return;
  }

  const locationParts = [
    collectorCharacter.location?.subZone,
    collectorCharacter.location?.zone,
  ].filter(
    (part, index, parts) =>
      part &&
      parts.findIndex(
        (candidate) =>
          String(candidate).toLowerCase() === String(part).toLowerCase(),
      ) === index,
  );
  const endedAt = session.endedAt || collectorCharacter.lastLogoutAt;
  const dateTimestamp = endedAt || session.startedAt;
  const dateLabel = new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateTimestamp * 1000));
  const timeRange = endedAt
    ? `${formatCollectorClock(session.startedAt)}–${formatCollectorClock(endedAt)}`
    : `depuis ${formatCollectorClock(session.startedAt)}`;
  const details = [dateLabel, timeRange];

  if (
    session.durationSeconds !== null &&
    session.durationSeconds !== undefined
  ) {
    details.push(formatCollectorDuration(session.durationSeconds));
  }

  locationElement.textContent =
    locationParts.join(" · ") || "Lieu non enregistré";
  timeElement.textContent = details.join(" · ");
  timeElement.dateTime = new Date(dateTimestamp * 1000).toISOString();
  container.hidden = false;
}

// ======================================================
// Informations de classe
// ======================================================

const classDetails = {
  1: { name: "Guerrier", color: "#c69b6d", icon: "warrior" },
  2: { name: "Paladin", color: "#f48cba", icon: "paladin" },
  3: { name: "Chasseur", color: "#aad372", icon: "hunter" },
  4: { name: "Voleur", color: "#fff468", icon: "rogue" },
  5: { name: "Prêtre", color: "#ffffff", icon: "priest" },
  6: { name: "Chevalier de la mort", color: "#c41e3a", icon: "death-knight" },
  7: { name: "Chaman", color: "#0070dd", icon: "shaman" },
  8: { name: "Mage", color: "#3fc7eb", icon: "mage" },
  9: { name: "Démoniste", color: "#8788ee", icon: "warlock" },
  10: { name: "Moine", color: "#00ff98", icon: "monk" },
  11: { name: "Druide", color: "#ff7c0a", icon: "druid" },
  12: { name: "Chasseur de démons", color: "#a330c9", icon: "demon-hunter" },
  13: { name: "Évocateur", color: "#33937f", icon: "evoker" },
};

// ======================================================
// Icônes de classe SVG intégrées au cadre
// ======================================================

function getClassIconSvg(iconName) {
  const icons = {
    warrior: `
      <path d="m6 5 8 8m4 4 8 8M26 5l-8 8m-4 4-8 8"/>
      <path d="m4 3 7 2-5 5-2-7Zm24 0-7 2 5 5 2-7ZM5 24l3 3m19-3-3 3"/>
    `,
    paladin: `
      <path d="M16 3v7m-3-4h6M9 13l7-4 7 4v7c0 4-3 7-7 9-4-2-7-5-7-9v-7Z"/>
      <path d="M12 18h8m-4-4v9"/>
    `,
    hunter: `
      <path d="M7 4c9 4 15 12 18 21M7 4c-4 8-2 17 6 23"/>
      <path d="M5 27 27 5m-7 0h7v7M4 28l5-1-4-4"/>
      <path d="M8 8c5 2 10 7 13 13"/>
    `,
    rogue: `
      <path d="m9 4 5 5-3 3-5-5 3-3Zm14 0 3 3-5 5-3-3 5-5Z"/>
      <path d="m13 10 3 3-8 15-4 1 1-4 8-15Zm6 0-3 3 8 15 4 1-1-4-8-15Z"/>
    `,
    priest: `
      <circle cx="16" cy="8" r="4"/>
      <path d="M16 12v17m-7-10c2-4 4-6 7-7 3 1 5 3 7 7M10 24h12M6 11l4 2m16-2-4 2"/>
    `,
    "death-knight": `
      <path d="m16 3 4 5-2 4 5 4-4 4 2 7-5-3-5 3 2-7-4-4 5-4-2-4 4-5Z"/>
      <circle cx="16" cy="16" r="3"/>
      <path d="M16 13V8m0 11v5M13 16H8m11 0h5"/>
    `,
    shaman: `
      <path d="m18 3-8 13h6l-2 13 9-15h-6l1-11Z"/>
      <path d="M5 26h6m10 0h6M7 22l-2 4 2 3m18-7 2 4-2 3"/>
    `,
    mage: `
      <path d="m16 2 3 8 8-3-4 7 7 4-8 1 2 9-8-6-8 6 2-9-8-1 7-4-4-7 8 3 3-8Z"/>
      <circle cx="16" cy="16" r="4"/>
    `,
    warlock: `
      <path d="M4 16c4-6 8-9 12-9s8 3 12 9c-4 6-8 9-12 9S8 22 4 16Z"/>
      <circle cx="16" cy="16" r="5"/>
      <path d="m16 11 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4Z"/>
    `,
    monk: `
      <circle cx="16" cy="16" r="12"/>
      <path d="M16 4c5 4 5 9 0 12s-5 8 0 12"/>
      <circle cx="12" cy="11" r="1.5"/><circle cx="20" cy="21" r="1.5"/>
    `,
    druid: `
      <path d="M16 28V13m0 0c-5-1-8-4-9-9m9 9c5-1 8-4 9-9M7 4c-2 4 0 8 5 10m13-10c2 4 0 8-5 10"/>
      <path d="M10 28c1-5 3-8 6-10 3 2 5 5 6 10"/>
    `,
    "demon-hunter": `
      <path d="M4 8c7-4 11-2 12 5 1-7 5-9 12-5-5 3-8 7-8 12l6 7-10-5-10 5 6-7c0-5-3-9-8-12Z"/>
      <path d="M10 14c4 3 8 3 12 0"/>
    `,
    evoker: `
      <path d="M16 3c2 4 6 5 11 6-4 3-5 7-4 12-3 4-5 6-7 8-2-2-4-4-7-8 1-5 0-9-4-12 5-1 9-2 11-6Z"/>
      <path d="M16 9v14m0-8-5-3m5 3 5-3m-5 7-4 3m4-3 4 3"/>
    `,
  };

  const paths = icons[iconName] || icons.warrior;

  return `
    <svg class="character-class-icon-svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      ${paths}
    </svg>
  `;
}

function getFactionIconMarkup(factionName) {
  const asset =
    factionName === "HORDE"
      ? "/assets/ui/factions/horde.png"
      : "/assets/ui/factions/alliance.png";

  return `
    <img class="character-faction-icon-image" src="${asset}" alt="" aria-hidden="true" />
  `;
}

// ======================================================
// Informations de race
// ======================================================

const raceNames = {
  1: "Humain",
  2: "Orc",
  3: "Nain",
  4: "Elfe de la nuit",
  5: "Mort-vivant",
  6: "Tauren",
  7: "Gnome",
  8: "Troll",
  9: "Gobelin",
  10: "Elfe de sang",
  11: "Draeneï",
  22: "Worgen",
  24: "Pandaren",
  25: "Pandaren",
  26: "Pandaren",
  27: "Sacrenuit",
  28: "Tauren de Haut-Roc",
  29: "Elfe du Vide",
  30: "Draeneï sancteforge",
  31: "Troll zandalari",
  32: "Kultirassien",
  34: "Nain sombrefer",
  35: "Vulpérin",
  36: "Orc mag'har",
  37: "Mécagnome",
  52: "Dracthyr",
  70: "Dracthyr",
};

// ======================================================
// Personnages de demonstration - Hall des heros
// Ils sont ajoutes apres les vrais personnages Battle.net.
// ======================================================

const showcaseCharacters = [
  {
    name: "Aegis",
    classId: 1,
    raceId: 37,
    faction: "ALLIANCE",
    realm: "Forgefer",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Lumiel",
    classId: 2,
    raceId: 30,
    faction: "ALLIANCE",
    realm: "Exodar",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Sylvaris",
    classId: 3,
    raceId: 34,
    faction: "ALLIANCE",
    realm: "Forgefer",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Noctelys",
    classId: 4,
    raceId: 29,
    faction: "ALLIANCE",
    realm: "Telogrus",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Seraphine",
    classId: 5,
    raceId: 1,
    faction: "ALLIANCE",
    realm: "Hurlevent",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Givrecoeur",
    classId: 6,
    raceId: 22,
    faction: "ALLIANCE",
    realm: "Gilneas",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Oragebleu",
    classId: 7,
    raceId: 11,
    faction: "ALLIANCE",
    realm: "Exodar",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Arcanis",
    classId: 8,
    raceId: 32,
    faction: "ALLIANCE",
    realm: "Boralus",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Grimmoire",
    classId: 9,
    raceId: 7,
    faction: "ALLIANCE",
    realm: "Gnomeregan",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Brumepatte",
    classId: 10,
    raceId: 24,
    faction: "ALLIANCE",
    realm: "Île Vagabonde",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Verdelune",
    classId: 11,
    raceId: 4,
    faction: "ALLIANCE",
    realm: "Darnassus",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Ombrelame",
    classId: 12,
    raceId: 4,
    faction: "ALLIANCE",
    realm: "Darnassus",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Azurion",
    classId: 13,
    raceId: 52,
    faction: "ALLIANCE",
    realm: "Valdrakken",
    level: 80,
    genderName: "♂",
  },

  {
    name: "Gromkar",
    classId: 1,
    raceId: 6,
    faction: "HORDE",
    realm: "Mulgore",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Solaria",
    classId: 2,
    raceId: 31,
    faction: "HORDE",
    realm: "Zuldazar",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Crocdombre",
    classId: 3,
    raceId: 35,
    faction: "HORDE",
    realm: "Voldun",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Rasepièce",
    classId: 4,
    raceId: 9,
    faction: "HORDE",
    realm: "Kezan",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Mornevoile",
    classId: 5,
    raceId: 5,
    faction: "HORDE",
    realm: "Fossoyeuse",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Crânefer",
    classId: 6,
    raceId: 36,
    faction: "HORDE",
    realm: "Draenor",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Tonnerre",
    classId: 7,
    raceId: 8,
    faction: "HORDE",
    realm: "Durotar",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Astrelune",
    classId: 8,
    raceId: 27,
    faction: "HORDE",
    realm: "Suramar",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Maleficus",
    classId: 9,
    raceId: 2,
    faction: "HORDE",
    realm: "Orgrimmar",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Brumezen",
    classId: 10,
    raceId: 26,
    faction: "HORDE",
    realm: "Île Vagabonde",
    level: 80,
    genderName: "♂",
  },
  {
    name: "Roncehaute",
    classId: 11,
    raceId: 28,
    faction: "HORDE",
    realm: "Haut-Roc",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Fielsang",
    classId: 12,
    raceId: 10,
    faction: "HORDE",
    realm: "Lune-d’Argent",
    level: 80,
    genderName: "♀",
  },
  {
    name: "Rubécaile",
    classId: 13,
    raceId: 70,
    faction: "HORDE",
    realm: "Valdrakken",
    level: 80,
    genderName: "♀",
  },
].map((character, index) => ({
  ...character,
  id: `showcase-${index + 1}`,
  isShowcase: true,
}));

// ======================================================
// Portraits des personnages
// ======================================================

function getMediaAsset(character, key) {
  const assets = character.media?.assets || character.assets || [];
  const asset = assets.find(
    (item) => String(item?.key || "").toLowerCase() === key,
  );
  return asset?.value || null;
}

function getShowcasePortrait(character) {
  const numericId = Number(String(character.id || "").replace(/\D/g, "")) || 1;
  return `/assets/characters/showcase/avatars/showcase-${String(numericId).padStart(2, "0")}.webp`;
}

function getCharacterFallbackPortrait(character) {
  const classId = Math.min(13, Math.max(1, Number(character.classId) || 1));
  const factionOffset =
    String(character.factionName || character.faction || "").toUpperCase() ===
    "HORDE"
      ? 13
      : 0;
  const portraitIndex = classId + factionOffset;

  return `/assets/characters/showcase/avatars/showcase-${String(portraitIndex).padStart(2, "0")}.webp`;
}

function getCharacterPortraitImage(character) {
  if (character.isShowcase) {
    return getShowcasePortrait(character);
  }

  return (
    getMediaAsset(character, "avatar") ||
    character.avatarUrl ||
    character.avatar ||
    character.media?.avatar ||
    getMediaAsset(character, "inset") ||
    character.media?.bust_url ||
    character.portraitUrl ||
    getCharacterFallbackPortrait(character)
  );
}

function getCharacterImage(character) {
  if (character.isShowcase) {
    return getShowcasePortrait(character);
  }

  const battleNetImage =
    character.portraitUrl ||
    getMediaAsset(character, "inset") ||
    character.media?.bust_url ||
    character.avatarUrl ||
    character.avatar ||
    character.imageUrl ||
    character.image ||
    character.media?.avatar ||
    getMediaAsset(character, "avatar") ||
    getMediaAsset(character, "main-raw");

  if (battleNetImage) {
    return battleNetImage;
  }

  return getCharacterFallbackPortrait(character);
}

function getCharacterFullBodyImage(character) {
  if (character.isShowcase) {
    return null;
  }

  return (
    character.fullBodyUrl ||
    getMediaAsset(character, "main") ||
    getMediaAsset(character, "main-raw") ||
    character.media?.render_url ||
    null
  );
}

function getGenderIconSvg(gender) {
  const normalizedGender = String(gender || "")
    .trim()
    .toLowerCase();
  const isFemale = ["female", "féminin", "feminin", "♀"].includes(
    normalizedGender,
  );

  if (isFemale) {
    return `
      <svg class="character-gender-icon character-gender-icon-female" viewBox="0 0 24 24" role="img" aria-label="Féminin">
        <circle cx="12" cy="8" r="5"></circle>
        <path d="M12 13v8M8.5 17h7"></path>
      </svg>
    `;
  }

  return `
    <svg class="character-gender-icon character-gender-icon-male" viewBox="0 0 24 24" role="img" aria-label="Masculin">
      <circle cx="9" cy="15" r="5"></circle>
      <path d="M12.5 11.5 19 5M14 5h5v5"></path>
    </svg>
  `;
}

// ======================================================
// Normalisation des données Blizzard
// ======================================================

function normalizeCharacter(character) {
  const classInfo = classDetails[character.classId] || {
    name: `Classe ${character.classId}`,
    color: "#d6b76d",
    icon: "⚔",
  };

  return {
    ...character,
    className: classInfo.name,
    classColor: classInfo.color,
    classIcon: classInfo.icon,
    raceName: raceNames[character.raceId] || `Race ${character.raceId}`,
    factionName: String(character.faction || "Alliance").toUpperCase(),
    genderName:
      character.genderName || character.gender?.name || character.gender || "",
    isShowcase: Boolean(character.isShowcase),
    image: getCharacterImage(character),
  };
}

// ======================================================
// Création d'une carte
// ======================================================

function createCharacterCard(character) {
  const card = document.createElement("article");

  card.className = "character-card";
  card.dataset.characterName = character.name;
  card.dataset.characterKey = getCharacterKey(character);
  card.dataset.faction = character.factionName;
  card.dataset.classId = String(character.classId);
  card.classList.toggle("showcase-character", character.isShowcase);

  if (isCurrentCharacter(character)) {
    card.classList.add("active-character");
  }

  card.style.setProperty("--class-color", character.classColor);
  card.style.setProperty("--character-image", `url("${character.image}")`);

  card.innerHTML = `
    <div class="character-card-inner">
      <section class="character-card-face character-card-front">
        <svg class="character-frame" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
          <path class="character-frame-shadow" pathLength="100" d="M7 1 H93 L99 7 V153 L93 159 H7 L1 153 V7 Z" />
          <path class="character-frame-line" pathLength="100" d="M7 1 H93 L99 7 V153 L93 159 H7 L1 153 V7 Z" />
        </svg>

        <span class="character-border-comet character-border-comet-one" aria-hidden="true"></span>
        <span class="character-border-comet character-border-comet-two" aria-hidden="true"></span>

        <span class="character-corner-icon character-corner-icon-top">
          ${getClassIconSvg(character.classIcon)}
        </span>

        <span
          class="character-corner-icon character-corner-icon-bottom character-corner-faction ${character.factionName === "HORDE" ? "is-horde" : "is-alliance"}"
          aria-label="${character.factionName}"
          title="${character.factionName}"
        >
          ${getFactionIconMarkup(character.factionName)}
        </span>

        <div class="character-card-background"></div>
        <div class="character-card-shade"></div>

        <div class="character-active-label">
          <span aria-hidden="true"></span>
          Sélectionné
        </div>

        <div class="character-card-front-content">
          <h3>${character.name}</h3>

          <div class="character-card-meta">
            <span class="character-race-line">
              <span>${character.raceName}</span>
              ${character.genderName ? getGenderIconSvg(character.genderName) : ""}
            </span>

            <strong class="character-class-name">
              ${character.className}
            </strong>

            <span class="character-info-divider" aria-hidden="true">
              <i></i><b>◇</b><i></i>
            </span>

            <span class="character-level-line">
              Niveau ${character.level}
            </span>

            <span class="character-realm">
              ${character.realm}
            </span>
          </div>
        </div>
      </section>
    </div>
  `;

  card.addEventListener("click", () => {
    openCharacterProfile(character);
  });

  return card;
}

// ======================================================
// Affichage des cartes
// ======================================================

function renderCharacters() {
  if (!charactersList) {
    return;
  }

  const searchValue = String(charactersSearchInput?.value || "")
    .trim()
    .toLowerCase();

  const filteredCharacters = blizzardCharacters
    .filter((character) => {
      const matchesFaction =
        currentFactionFilter === "all" ||
        character.factionName === currentFactionFilter;

      const matchesSearch =
        !searchValue ||
        character.name.toLowerCase().includes(searchValue) ||
        String(character.realm || "")
          .toLowerCase()
          .includes(searchValue) ||
        character.className.toLowerCase().includes(searchValue);

      return matchesFaction && matchesSearch;
    })
    .sort((firstCharacter, secondCharacter) => {
      const firstIsActive = isCurrentCharacter(firstCharacter);
      const secondIsActive = isCurrentCharacter(secondCharacter);

      return Number(secondIsActive) - Number(firstIsActive);
    });

  charactersList.innerHTML = "";

  if (!filteredCharacters.length) {
    charactersList.innerHTML = `
      <div class="characters-empty">
        Aucun personnage ne correspond à ta recherche.
      </div>
    `;

    return;
  }

  filteredCharacters.forEach((character, index) => {
    const card = createCharacterCard(character);
    card.style.setProperty("--card-index", String(index));
    charactersList.appendChild(card);
  });
}

// ======================================================
// Sélection du personnage
// ======================================================

function updateDashboardCharacter(character) {
  const heroName = document.getElementById("hero-name");
  const heroPlayerName = document.getElementById("hero-player-name");
  const heroClass = document.getElementById("hero-class");
  const heroRace = document.getElementById("hero-race");
  const heroFaction = document.getElementById("hero-faction");
  const heroRealm = document.getElementById("hero-realm");
  const heroLevel = document.getElementById("hero-level");
  const heroAvatar = document.getElementById("hero-avatar");
  const heroLevelMedallion = document.querySelector(".player-level-medallion");
  const sidebarCharacterName = document.getElementById(
    "sidebar-character-name",
  );
  const sidebarCharacterStatus = document.getElementById(
    "sidebar-character-status",
  );
  const sidebarCharacterRealm = document.getElementById(
    "sidebar-character-realm",
  );
  const sidebarCharacterLevel = document.getElementById(
    "sidebar-character-level",
  );
  const sidebarCharacterDetails = document.getElementById(
    "sidebar-character-details",
  );

  if (heroName) {
    heroName.textContent = character.name;
  }

  if (heroPlayerName) {
    heroPlayerName.textContent = character.name;
  }

  if (heroClass) {
    heroClass.textContent = character.className;
    heroClass.style.color = character.classColor;
  }

  if (heroRace) {
    heroRace.textContent = character.raceName;
  }

  if (heroFaction) {
    heroFaction.textContent = character.factionName;
  }

  if (heroRealm) {
    heroRealm.textContent = character.realm;
  }

  if (heroLevel) {
    heroLevel.textContent = character.level;
  }

  if (heroLevelMedallion) {
    heroLevelMedallion.setAttribute("aria-label", `Niveau ${character.level}`);
  }

  if (heroAvatar) {
    heroAvatar.src = character.image;
    heroAvatar.alt = `Portrait de ${character.name}`;
    heroAvatar.hidden = false;
  }

  if (sidebarCharacterName) sidebarCharacterName.textContent = character.name;
  if (sidebarCharacterStatus) {
    sidebarCharacterStatus.textContent = "Données Battle.net synchronisées";
  }
  if (sidebarCharacterRealm) {
    sidebarCharacterRealm.textContent = character.realm;
  }
  if (sidebarCharacterLevel) {
    sidebarCharacterLevel.textContent = `Niv. ${character.level}`;
  }
  if (sidebarCharacterDetails) {
    sidebarCharacterDetails.textContent = `${character.raceName} · ${character.className}`;
  }

  renderSidebarLastSession(character);
  renderHomeDashboardCharacter(character);
}

function renderCharacterUnavailable(message) {
  const sidebarCharacterName = document.getElementById(
    "sidebar-character-name",
  );
  const sidebarCharacterStatus = document.getElementById(
    "sidebar-character-status",
  );

  if (sidebarCharacterName) {
    sidebarCharacterName.textContent = "Aucun héros chargé";
  }

  if (sidebarCharacterStatus) {
    sidebarCharacterStatus.textContent = message;
  }

  const sidebarLastSession = document.getElementById("sidebar-last-session");
  if (sidebarLastSession) {
    sidebarLastSession.hidden = true;
  }
}

function selectCharacter(character) {
  currentCharacterKey = getCharacterKey(character);
  saveSelectedCharacterKey(currentCharacterKey);

  document.querySelectorAll(".character-card").forEach((card) => {
    card.classList.toggle(
      "active-character",
      card.dataset.characterKey === currentCharacterKey,
    );
  });

  updateDashboardCharacter(character);

  openDashboardView();
}

function renderBattleStatus(state, message) {
  if (!battleStatus || !battleStatusText) return;

  battleStatus.classList.toggle("is-connected", state === "connected");
  battleStatus.classList.toggle("is-disconnected", state === "disconnected");
  battleStatus.classList.toggle("is-loading", state === "loading");
  battleStatusText.textContent = message;
}

// ======================================================
// Chargement depuis Blizzard
// ======================================================

async function loadCharacters() {
  if (!charactersList) {
    return;
  }

  renderBattleStatus("loading", "Synchronisation...");

  charactersList.innerHTML = `
    <div class="characters-loading">
      Chargement des personnages...
    </div>
  `;

  try {
    await loadCollectorCharacters();
    const response = await fetch(`/api/characters?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (response.status === 401) {
      renderBattleStatus("disconnected", "Compte non connecté");
      renderCharacterUnavailable("Compte Battle.net non connecté");
      charactersList.innerHTML = `
        <div class="characters-empty">
          <p>Ton compte Battle.net n’est pas connecté.</p>
          <a class="characters-connect-button" href="/auth/blizzard">
            Se connecter à Battle.net
          </a>
        </div>
      `;
      return;
    }

    if (!response.ok) {
      throw new Error("Impossible de charger les personnages.");
    }

    const data = await response.json();

    if (!data.connected) {
      renderCharacterUnavailable("Compte Battle.net non connecté");
      charactersList.innerHTML = `
        <div class="characters-empty">
          <p>Ton compte Battle.net n’est pas connecté.</p>
          <a class="characters-connect-button" href="/auth/blizzard">
            Se connecter à Battle.net
          </a>
        </div>
      `;
      return;
    }

    const realCharacters = (data.characters || []).map(normalizeCharacter);
    const demoCharacters = showcaseCharacters.map(normalizeCharacter);

    blizzardCharacters = [...realCharacters, ...demoCharacters];

    const collectorSelectedCharacter =
      findBattleNetCharacterFromCollector(realCharacters);
    const savedSelectedCharacter = blizzardCharacters.find(isCurrentCharacter);

    const selectedCharacter =
      collectorSelectedCharacter ||
      savedSelectedCharacter ||
      realCharacters[0] ||
      null;

    if (selectedCharacter) {
      currentCharacterKey = getCharacterKey(selectedCharacter);
      saveSelectedCharacterKey(currentCharacterKey);
      updateDashboardCharacter(selectedCharacter);
    }

    if (charactersCount) {
      charactersCount.textContent = blizzardCharacters.length;
    }

    renderBattleStatus(
      "connected",
      `${realCharacters.length} personnage${realCharacters.length > 1 ? "s" : ""} Battle.net + ${demoCharacters.length} aperçus`,
    );

    renderCharacters();
    renderHomeDashboardAccount(realCharacters);
  } catch (error) {
    console.error(error);

    renderBattleStatus("disconnected", "Synchronisation impossible");
    renderCharacterUnavailable("Synchronisation impossible");
    charactersList.innerHTML = `
      <div class="characters-empty">
        Impossible de charger les personnages Battle.net.
      </div>
    `;
  }
}


// ======================================================
// Accueil du compte Azer Companion
// ======================================================

function formatHomeDate(timestamp) {
  if (!timestamp) return "Dernière session inconnue";

  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(Number(timestamp) * 1000));
}

function getCollectorCharacter(character) {
  return collectorCharacters.get(getCollectorCharacterKey(character)) || null;
}

function getCollectorSessions(character) {
  const collectorCharacter = getCollectorCharacter(character);
  const sessions = Array.isArray(collectorCharacter?.sessions)
    ? collectorCharacter.sessions
    : [];

  if (collectorCharacter?.latestSession) {
    const latestKey = `${collectorCharacter.latestSession.startedAt || 0}:${collectorCharacter.latestSession.endedAt || 0}`;
    const alreadyIncluded = sessions.some(
      (session) => `${session.startedAt || 0}:${session.endedAt || 0}` === latestKey,
    );

    if (!alreadyIncluded) sessions.push(collectorCharacter.latestSession);
  }

  return sessions;
}

function getHomeLocation(character) {
  const collectorCharacter = getCollectorCharacter(character);
  const parts = [
    collectorCharacter?.location?.subZone,
    collectorCharacter?.location?.zone,
  ].filter(Boolean);

  return [...new Set(parts)].join(" · ") || "Lieu non enregistré";
}

function getLastHomeSession(character) {
  const collectorCharacter = getCollectorCharacter(character);
  return collectorCharacter?.latestSession || null;
}

function renderHomeDashboardCharacter(character) {
  if (!character) return;

  const collectorCharacter = getCollectorCharacter(character);
  const session = getLastHomeSession(character);
  const lastTimestamp = getCollectorActivityTimestamp(collectorCharacter);
  const location = getHomeLocation(character);
  const duration = session?.durationSeconds
    ? formatCollectorDuration(session.durationSeconds)
    : "Durée non enregistrée";

  const values = {
    homeHeroName: character.name,
    homeHeroClass: character.className,
    homeHeroLevel: character.level,
    homeHeroLocation: location,
    homeHeroLastPlayed: formatHomeDate(lastTimestamp),
    homeHeroDuration: duration,
    timelineCurrentLocation: location,
    timelineSessionDuration: duration,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  const portraitImage = getCharacterPortraitImage(character);
  const avatar = document.getElementById("homeHeroAvatar");
  const heroMedallion = document.getElementById("homeHeroMedallion");
  const heroFactionFrame = document.getElementById("homeHeroFactionFrame");
  const normalizedCharacterName = String(character.name || "").trim().toLowerCase();
  const isHorde = character.factionName === "HORDE";

  if (avatar) {
    avatar.src = portraitImage;
    avatar.alt = `Portrait de ${character.name}`;
    avatar.hidden = false;
    avatar.dataset.character = normalizedCharacterName;
  }
  if (heroMedallion) {
    heroMedallion.dataset.faction = isHorde ? "HORDE" : "ALLIANCE";
  }
  if (heroFactionFrame) {
    heroFactionFrame.src = isHorde
      ? "/assets/factions/azer-horde.png"
      : "/assets/factions/azer-alliance.png";
  }

  const accountAvatar = document.getElementById("sidebar-account-avatar");
  const accountInitial = document.getElementById("sidebar-account-initial");
  const accountName = document.getElementById("sidebar-account-name");
  const accountDetails = document.getElementById("sidebar-account-details");
  const factionEmblem = document.getElementById("sidebar-faction-emblem");
  const factionName = document.getElementById("sidebar-faction-name");

  if (accountAvatar) {
    accountAvatar.src = portraitImage;
    accountAvatar.alt = `Portrait de ${character.name}`;
    accountAvatar.hidden = false;
  }
  if (accountInitial) accountInitial.hidden = true;
  if (accountName) accountName.textContent = character.name;
  if (accountDetails) {
    accountDetails.textContent = `${character.className} · Niv. ${character.level} · ${character.realm}`;
  }
  if (factionEmblem) {
    factionEmblem.src = isHorde
      ? "/assets/factions/azer-horde.png"
      : "/assets/factions/azer-alliance.png";
    factionEmblem.alt = isHorde ? "Horde" : "Alliance";
  }
  if (factionName) factionName.textContent = isHorde ? "HORDE" : "ALLIANCE";
}

function renderHomeHeroes(characters) {
  const strip = document.getElementById("homeHeroesStrip");
  if (!strip) return;

  strip.innerHTML = "";
  characters
    .slice()
    .sort((a, b) => Number(isCurrentCharacter(b)) - Number(isCurrentCharacter(a)))
    .slice(0, 6)
    .forEach((character) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "home-hero-card";
      button.classList.toggle("is-active", isCurrentCharacter(character));
      button.style.setProperty("--home-class-color", character.classColor);
      button.innerHTML = `
        <img src="${character.image}" alt="" />
        <strong>${character.name}</strong>
        <small>Niv. ${character.level} · ${character.className}</small>
      `;
      button.addEventListener("click", () => openCharacterProfile(character));
      strip.appendChild(button);
    });
}

function renderHomeDashboardAccount(characters) {
  const realCharacters = characters.filter((character) => !character.isShowcase);
  const collectorList = [...collectorCharacters.values()];
  const totalLevels = realCharacters.reduce(
    (total, character) => total + (Number(character.level) || 0),
    0,
  );
  const zones = new Set(
    collectorList
      .map((character) => character?.location?.zone)
      .filter(Boolean),
  );
  const sessions = collectorList.flatMap((character) => {
    const list = Array.isArray(character?.sessions) ? character.sessions : [];
    return list.length ? list : character?.latestSession ? [character.latestSession] : [];
  });
  const nowSeconds = Date.now() / 1000;
  const weekStart = nowSeconds - 7 * 24 * 60 * 60;
  const weekSeconds = sessions.reduce((total, session) => {
    const startedAt = Number(session?.startedAt || 0);
    if (startedAt < weekStart) return total;
    return total + Number(session?.durationSeconds || 0);
  }, 0);
  const weekLabel = formatCollectorDuration(weekSeconds);

  const values = {
    accountCharactersCount: realCharacters.length,
    accountLevelsTotal: totalLevels,
    accountSessionsCount: sessions.length,
    accountZonesCount: zones.size,
    accountWeekTime: weekLabel,
    activityWeekTime: weekLabel,
    timelineCharacters: `${realCharacters.length} personnage${realCharacters.length > 1 ? "s" : ""} Battle.net`,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  renderHomeHeroes(realCharacters);
}

function openCurrentCharacterProfile() {
  const character = blizzardCharacters.find(isCurrentCharacter);
  if (character) openCharacterProfile(character);
}

document
  .getElementById("continueAdventureButton")
  ?.addEventListener("click", openCurrentCharacterProfile);

document
  .getElementById("viewAllHeroesButton")
  ?.addEventListener("click", openCharactersView);

document
  .getElementById("hallHeroesNav")
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    openCharactersView();
  });

// ======================================================
// Navigation entre les vues
// ======================================================

const views = {
  dashboard: document.getElementById("dashboardView"),
  characters: document.getElementById("charactersView"),
  characterProfile: document.getElementById("characterProfileView"),
};

function showView(name) {
  const targetView = views[name];

  if (!targetView) {
    console.warn(`Vue inconnue : ${name}`);
    return;
  }

  Object.entries(views).forEach(([viewName, view]) => {
    if (!view) {
      return;
    }

    const isActive = viewName === name;

    view.classList.toggle("app-view-active", isActive);
    view.setAttribute("aria-hidden", String(!isActive));
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openCharactersView() {
  showView("characters");

  const shell = document.querySelector(".azer-shell");
  const sidebar = document.getElementById("sideMenu");
  const handle = document.getElementById("sidebarHandle");

  if (shell && sidebar && window.matchMedia("(min-width: 981px)").matches) {
    shell.classList.add("sidebar-is-collapsed");
    sidebar.classList.add("is-collapsed");

    handle?.setAttribute("aria-expanded", "false");
    handle?.setAttribute("aria-label", "Ouvrir la navigation");

    const icon = handle?.querySelector(".sidebar-handle-icon");

    if (icon) {
      icon.textContent = "›";
    }
  }

  if (!blizzardCharacters.length) {
    loadCharacters();
  } else {
    renderCharacters();
  }

  window.setTimeout(() => {
    charactersSearchInput?.focus();
  }, 180);
}

function formatCharacterProfessions(professions) {
  if (!professions.length) {
    return "Aucun métier n’a été renvoyé par Battle.net.";
  }

  return professions
    .map((profession) => {
      const learnedTiers = profession.tiers.filter(
        (tier) => tier.skillPoints > 0 || tier.maxSkillPoints > 0,
      );
      const tierText = learnedTiers.length
        ? learnedTiers
            .map(
              (tier) =>
                `${tier.name} : ${tier.skillPoints}/${tier.maxSkillPoints}`,
            )
            .join(" · ")
        : "niveau non disponible";
      const typeLabel = profession.type === "secondary" ? "Secondaire — " : "";

      return `${typeLabel}${profession.name} — ${tierText}`;
    })
    .join("\n");
}

async function loadCharacterProfessions(character) {
  const professionsElement = document.getElementById(
    "profileCharacterProfessions",
  );

  if (!professionsElement) {
    return;
  }

  if (character.isShowcase) {
    professionsElement.textContent =
      "Aperçu de démonstration : aucune donnée Battle.net.";
    return;
  }

  const requestedCharacterKey = getCharacterKey(character);
  professionsElement.textContent = "Chargement des métiers...";

  try {
    const realm = encodeURIComponent(character.realm);
    const name = encodeURIComponent(character.name);
    const response = await fetch(
      `/api/characters/${realm}/${name}/professions`,
    );

    if (!response.ok) {
      throw new Error("Métiers indisponibles.");
    }

    const data = await response.json();

    if (
      !profiledCharacter ||
      getCharacterKey(profiledCharacter) !== requestedCharacterKey
    ) {
      return;
    }

    professionsElement.textContent = formatCharacterProfessions(
      data.professions || [],
    );
  } catch (error) {
    console.error(error);

    if (
      profiledCharacter &&
      getCharacterKey(profiledCharacter) === requestedCharacterKey
    ) {
      professionsElement.textContent =
        "Les métiers sont indisponibles pour ce personnage.";
    }
  }
}

function renderCharacterProfileImage(character, requestedMode = "portrait") {
  const profileImage = document.getElementById("profileCharacterImage");
  const portraitContainer = document.querySelector(
    ".character-profile-portrait",
  );
  const fullBodyImage = getCharacterFullBodyImage(character);
  const portraitImage = character.image;
  const canShowFullBody = Boolean(fullBodyImage);

  profileImageMode =
    requestedMode === "full-body" && canShowFullBody ? "full-body" : "portrait";
  const usesFullBodyForPortrait =
    profileImageMode === "portrait" && canShowFullBody;

  if (profileImage) {
    profileImage.src =
      profileImageMode === "full-body" || usesFullBodyForPortrait
        ? fullBodyImage
        : portraitImage;
    profileImage.alt =
      profileImageMode === "full-body"
        ? `Vue en pied de ${character.name}`
        : `Portrait de ${character.name}`;
  }

  portraitContainer?.classList.toggle(
    "is-full-body",
    profileImageMode === "full-body",
  );
  portraitContainer?.classList.toggle(
    "uses-high-resolution-portrait",
    usesFullBodyForPortrait,
  );

  document.querySelectorAll("[data-profile-image-mode]").forEach((button) => {
    const buttonMode = button.dataset.profileImageMode;
    const isSelected = buttonMode === profileImageMode;

    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));

    if (buttonMode === "full-body") {
      button.disabled = !canShowFullBody;
      button.title = canShowFullBody
        ? "Afficher le personnage en entier"
        : "Vue en pied indisponible chez Blizzard";
    }
  });
}

function openCharacterProfile(character) {
  profiledCharacter = character;

  const profileName = document.getElementById("profileCharacterName");
  const profileClass = document.getElementById("profileCharacterClass");
  const profileRace = document.getElementById("profileCharacterRace");
  const profileRealm = document.getElementById("profileCharacterRealm");
  const profileFactionDetail = document.getElementById(
    "profileCharacterFactionDetail",
  );
  const profileLevel = document.getElementById("profileCharacterLevel");
  const profileClassIcon = document.getElementById("profileCharacterClassIcon");
  const profileFactionIcon = document.getElementById(
    "profileCharacterFactionIcon",
  );
  const selectProfileCharacter = document.getElementById(
    "selectProfileCharacter",
  );

  if (profileName) profileName.textContent = character.name;

  views.characterProfile?.style.setProperty(
    "--profile-class-color",
    character.classColor,
  );
  views.characterProfile?.style.setProperty(
    "--class-color",
    character.classColor,
  );

  renderCharacterProfileImage(character);

  if (profileClass) {
    profileClass.textContent = character.className;
    profileClass.style.color = character.classColor;
  }

  if (profileRace) profileRace.textContent = character.raceName;
  if (profileRealm) profileRealm.textContent = character.realm;
  if (profileFactionDetail) {
    profileFactionDetail.textContent = character.factionName;
  }
  if (profileLevel) profileLevel.textContent = character.level;

  if (profileClassIcon) {
    profileClassIcon.innerHTML = getClassIconSvg(character.classIcon);
  }

  if (profileFactionIcon) {
    const isHorde = character.factionName === "HORDE";

    profileFactionIcon.classList.toggle("is-horde", isHorde);
    profileFactionIcon.classList.toggle("is-alliance", !isHorde);
    profileFactionIcon.innerHTML = getFactionIconMarkup(character.factionName);
  }

  if (selectProfileCharacter) {
    const characterIsActive = isCurrentCharacter(character);

    selectProfileCharacter.hidden = character.isShowcase;
    selectProfileCharacter.disabled = characterIsActive;
    selectProfileCharacter.textContent = characterIsActive
      ? "Héros sélectionné"
      : "Choisir ce héros";
  }

  showView("characterProfile");
  loadCharacterProfessions(character);
}

function openDashboardView() {
  showView("dashboard");
  revealSidebar();
}

function revealSidebar() {
  const shell = document.querySelector(".azer-shell");
  const sidebar = document.getElementById("sideMenu");
  const handle = document.getElementById("sidebarHandle");
  const mobileButton = document.getElementById("mobileMenuButton");

  shell?.classList.remove("sidebar-is-collapsed", "sidebar-is-closing");
  sidebar?.classList.remove("is-collapsed");

  if (window.matchMedia("(min-width: 981px)").matches) {
    handle?.setAttribute("aria-expanded", "true");
    handle?.setAttribute("aria-label", "Réduire la navigation");

    const icon = handle?.querySelector(".sidebar-handle-icon");

    if (icon) {
      icon.textContent = "‹";
    }
  } else {
    sidebar?.classList.add("is-open");
    mobileButton?.setAttribute("aria-expanded", "true");
  }
}

characterButton?.addEventListener("click", openCharactersView);

document
  .querySelector('[data-view-target="dashboard"]')
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    openDashboardView();
  });

document
  .getElementById("backToDashboardTop")
  ?.addEventListener("click", openDashboardView);

document
  .getElementById("charactersHomeCompass")
  ?.addEventListener("click", openDashboardView);

document.getElementById("backToCharacters")?.addEventListener("click", () => {
  showView("characters");
  revealSidebar();
});

document
  .getElementById("selectProfileCharacter")
  ?.addEventListener("click", () => {
    if (profiledCharacter && !profiledCharacter.isShowcase) {
      selectCharacter(profiledCharacter);
    }
  });

document.querySelectorAll("[data-profile-image-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    if (profiledCharacter) {
      renderCharacterProfileImage(
        profiledCharacter,
        button.dataset.profileImageMode,
      );
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  const profileActive =
    views.characterProfile?.classList.contains("app-view-active");
  const charactersActive =
    views.characters?.classList.contains("app-view-active");

  if (profileActive) {
    showView("characters");
  } else if (charactersActive) {
    openDashboardView();
  }
});

window.AzerCompanion = {
  showView,
  openDashboardView,
  openCharactersView,
  openCharacterProfile,
};

// ======================================================
// Recherche et filtres
// ======================================================

charactersSearchInput?.addEventListener("input", renderCharacters);

document.querySelectorAll("[data-faction-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    currentFactionFilter = button.dataset.factionFilter;

    document
      .querySelectorAll("[data-faction-filter]")
      .forEach((filterButton) => {
        filterButton.classList.remove("active");
      });

    button.classList.add("active");

    renderCharacters();
  });
});

loadCharacters();

async function updateBattleNetAuthButton() {
  const authButton = document.getElementById("battleNetAuthButton");

  if (!authButton) {
    return;
  }

  try {
    const response = await fetch("/api/blizzard/status", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Statut Battle.net indisponible (${response.status})`);
    }

    const status = await response.json();
    const isConnected = Boolean(status.connected);

    authButton.classList.toggle("is-online", isConnected);
    authButton.classList.toggle("is-offline", !isConnected);

    if (isConnected) {
      authButton.href = "/auth/blizzard/logout";
      authButton.title = "Battle.net connecté — cliquer pour se déconnecter";
      authButton.setAttribute("aria-label", "Se déconnecter de Battle.net");
    } else {
      authButton.href = "/auth/blizzard";
      authButton.title = "Battle.net non connecté — cliquer pour se connecter";
      authButton.setAttribute("aria-label", "Se connecter à Battle.net");
    }
  } catch (error) {
    console.error("Impossible de vérifier la connexion Battle.net :", error);

    authButton.href = "/auth/blizzard";
    authButton.classList.remove("is-online");
    authButton.classList.add("is-offline");
    authButton.title = "Battle.net non connecté";
    authButton.setAttribute("aria-label", "Se connecter à Battle.net");
  }
}

updateBattleNetAuthButton();
