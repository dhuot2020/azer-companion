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
const syncCharactersButton = document.getElementById("syncCharactersButton");

let blizzardCharacters = [];
let charactersSyncInProgress = false;
const missingPortraitWarnings = new Set();
let collectorCharacters = new Map();
let currentFactionFilter = "all";
let profiledCharacter = null;
let profileImageMode = "portrait";
const selectedCharacterStorageKey = "azerCompanion.selectedCharacter";
const charactersRosterStorageKey = "azerCompanion.charactersRoster.v1";
let currentCharacterKey = readSelectedCharacterKey();

function normalizeCharacterIdentityPart(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fr-CA");
}

function getCharacterKey(character) {
  if (character?.characterKey) {
    return String(character.characterKey);
  }

  const realm = normalizeCharacterIdentityPart(character?.realm);
  const name = normalizeCharacterIdentityPart(character?.name);
  return `${realm}::${name}`;
}

function hasCharacterMedia(character) {
  return Boolean(
    character?.avatarUrl ||
    character?.portraitUrl ||
    character?.fullBodyUrl
  );
}

function isOwnedCharacterMedia(character) {
  if (!character || !hasCharacterMedia(character)) return false;
  if (!character.mediaOwnerKey) return false;
  return character.mediaOwnerKey === getCharacterKey(character);
}

function readSelectedCharacterKey() {
  try {
    return localStorage.getItem(selectedCharacterStorageKey) || "";
  } catch (error) {
    console.warn("Impossible de lire le personnage sélectionné.", error);
    return "";
  }
}

function readCachedCharacterRoster() {
  try {
    const rawValue = localStorage.getItem(charactersRosterStorageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    const cachedCharacters = Array.isArray(parsedValue?.characters)
      ? parsedValue.characters
      : [];

    return cachedCharacters.filter(
      (character) => character?.name && character?.realm,
    );
  } catch (error) {
    console.warn("Impossible de lire le roster Azer Companion.", error);
    return [];
  }
}

function saveCachedCharacterRoster(characters = []) {
  try {
    localStorage.setItem(
      charactersRosterStorageKey,
      JSON.stringify({
        updatedAt: Date.now(),
        characters,
      }),
    );
  } catch (error) {
    console.warn("Impossible de sauvegarder le roster Azer Companion.", error);
  }
}

function mergeCharacterRosters(freshCharacters = [], previousCharacters = []) {
  const mergedCharacters = new Map();

  for (const character of previousCharacters) {
    if (character?.name && character?.realm) {
      mergedCharacters.set(getCharacterKey(character), character);
    }
  }

  // Les données fraîches ont toujours priorité sur le cache.
  for (const character of freshCharacters) {
    if (!character?.name || !character?.realm) {
      continue;
    }

    const characterKey = getCharacterKey(character);
    const previousCharacter = mergedCharacters.get(characterKey) || {};

    // Les données fraîches mettent à jour les statistiques, mais une réponse
    // média vide ne doit jamais effacer un portrait Battle.net déjà valide.
    const freshMediaIsOwned = isOwnedCharacterMedia(character);
    const previousMediaIsOwned = isOwnedCharacterMedia(previousCharacter);
    const mediaSource = freshMediaIsOwned &&
      (character.avatarUrl || character.portraitUrl || character.fullBodyUrl)
      ? character
      : previousMediaIsOwned
        ? previousCharacter
        : {};

    const mergedCharacter = {
      ...previousCharacter,
      ...character,
      characterKey,
      avatarUrl: mediaSource.avatarUrl || null,
      portraitUrl: mediaSource.portraitUrl || null,
      fullBodyUrl: mediaSource.fullBodyUrl || null,
      media: mediaSource.media || null,
      mediaOwnerKey:
        mediaSource.mediaOwnerKey ||
        ((mediaSource.avatarUrl || mediaSource.portraitUrl || mediaSource.fullBodyUrl)
          ? characterKey
          : null),
      portraitSource: mediaSource.portraitSource || character.portraitSource || null,
      isFallbackPortrait: Boolean(mediaSource.isFallbackPortrait || character.isFallbackPortrait),
    };

    mergedCharacters.set(characterKey, normalizeCharacter(mergedCharacter));
  }

  return [...mergedCharacters.values()].sort(
    (firstCharacter, secondCharacter) =>
      Number(secondCharacter.level || 0) - Number(firstCharacter.level || 0),
  );
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
// Portraits des personnages
// ======================================================

function getMediaAsset(character, key) {
  const assets = character.media?.assets || character.assets || [];
  const asset = assets.find(
    (item) => String(item?.key || "").toLowerCase() === key,
  );
  return asset?.value || null;
}

function getCharacterFallbackPortrait(character) {
  const classId = Math.min(13, Math.max(1, Number(character?.classId) || 1));
  const faction = String(
    character?.factionName || character?.faction || "ALLIANCE",
  ).toUpperCase();
  const factionOffset = faction === "HORDE" ? 13 : 0;
  const portraitIndex = classId + factionOffset;

  // Portrait Azer par classe et faction. Il évite tout médaillon vide sans
  // prétendre être le véritable visage du personnage.
  return `/assets/characters/showcase/avatars/showcase-${String(portraitIndex).padStart(2, "0")}.webp`;
}

function getCharacterPortraitImage(character) {
  if (!isOwnedCharacterMedia(character)) {
    const characterKey = getCharacterKey(character);

    // Un portrait manquant est un état normal pour un personnage dont le
    // profil individuel Blizzard n'est pas encore publié. On ne journalise
    // qu'une seule fois par personnage afin d'éviter le spam de la console.
    if (!missingPortraitWarnings.has(characterKey)) {
      missingPortraitWarnings.add(characterKey);
      console.info(
        `Portrait Blizzard indisponible pour ${character?.name}-${character?.realm}; ` +
          `portrait Azer de classe utilisé temporairement.`,
      );
    }

    return getCharacterFallbackPortrait(character);
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
  // Les cartes utilisent exclusivement les médias cadrés de Blizzard.
  // main et main-raw sont réservés à la vue plein corps du profil.
  return getCharacterPortraitImage(character);
}

function getCharacterFullBodyImage(character) {
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
    portraitSource: character.portraitSource || (character.isFallbackPortrait ? "azer-fallback" : "blizzard"),
    isFallbackPortrait: Boolean(character.isFallbackPortrait || character.portraitSource === "azer-fallback"),
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

        <div class="character-portrait-source ${character.isFallbackPortrait ? "is-azer" : "is-blizzard"}"
             title="${character.isFallbackPortrait ? "Portrait Azer temporaire" : "Portrait Blizzard"}">
          <span aria-hidden="true"></span>
          ${character.isFallbackPortrait ? "Portrait Azer" : "Blizzard"}
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


async function isBattleNetSessionConnected() {
  try {
    const response = await fetch("/api/blizzard/status", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return false;
    }

    const status = await response.json();
    return Boolean(status.connected);
  } catch (_error) {
    return false;
  }
}

function restoreCachedCharactersForExpiredSession() {
  const cachedCharacters = readCachedCharacterRoster().map(normalizeCharacter);

  if (cachedCharacters.length) {
    blizzardCharacters = mergeCharacterRosters(
      blizzardCharacters,
      cachedCharacters,
    );
    renderCharacters();
    renderBattleStatus(
      "disconnected",
      `${blizzardCharacters.length} personnages en cache · reconnecte Battle.net`,
    );
    return true;
  }

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
  return false;
}

async function loadCharacters(options = {}) {
  if (!charactersList) {
    return;
  }

  if (charactersSyncInProgress) {
    return;
  }

  charactersSyncInProgress = true;
  const isManualSync = Boolean(options.manual);

  syncCharactersButton?.classList.add("is-syncing");
  syncCharactersButton?.setAttribute("disabled", "");
  syncCharactersButton?.setAttribute("aria-busy", "true");
  renderBattleStatus("loading", isManualSync ? "Mise à jour en cours..." : "Synchronisation...");

  if (!blizzardCharacters.length) {
    charactersList.innerHTML = `
      <div class="characters-loading">
        Chargement des personnages...
      </div>
    `;
  }

  try {
    await loadCollectorCharacters();

    // Évite volontairement l'appel à /api/characters lorsque la session est
    // déjà expirée. Cela supprime le 401 rouge au chargement automatique.
    if (!isManualSync && !(await isBattleNetSessionConnected())) {
      restoreCachedCharactersForExpiredSession();
      return;
    }

    const syncEndpoint = isManualSync
      ? `/api/sync?ts=${Date.now()}`
      : `/api/characters?ts=${Date.now()}`;
    const response = await fetch(syncEndpoint, {
      method: isManualSync ? "POST" : "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      restoreCachedCharactersForExpiredSession();
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

    const freshCharacters = (data.characters || []).map(normalizeCharacter);
    const cachedCharacters = readCachedCharacterRoster().map(normalizeCharacter);
    const previousCharacters = blizzardCharacters.length
      ? blizzardCharacters
      : cachedCharacters;

    // Une réponse Battle.net temporairement incomplète ne doit jamais faire
    // disparaître des personnages déjà connus. Les données fraîches mettent à
    // jour le roster, tandis que le dernier roster complet conserve les absents.
    const realCharacters = mergeCharacterRosters(
      freshCharacters,
      previousCharacters,
    );

    blizzardCharacters = realCharacters;
    saveCachedCharacterRoster(blizzardCharacters);



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

    const syncTime = new Intl.DateTimeFormat("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());

    const achievementCount = Number(data.sync?.achievements?.count || 0);
    const syncDuration = Number(data.sync?.durationMs || 0);
    const statusParts = [
      `${realCharacters.length} personnage${realCharacters.length > 1 ? "s" : ""}`,
    ];

    const achievementLabel = `${achievementCount} haut${achievementCount > 1 ? "s" : ""} fait${achievementCount > 1 ? "s" : ""}`;
    statusParts.push(achievementLabel);

    statusParts.push(syncTime);
    renderBattleStatus("connected", statusParts.join(" · "));

    if (isManualSync && data.sync) {
      console.info("Azer Companion Sync 1.0.1", {
        durationMs: syncDuration,
        battleNet: data.sync.battleNet,
        collector: data.sync.collector,
        achievements: data.sync.achievements,
      });
    }

    renderCharacters();
    renderHomeDashboardAccount(realCharacters, data.dashboard || null);
    renderHomeJournal(data.journal || []);
    renderHomeAchievements(data.achievements || []);
  } catch (error) {
    console.error(error);

    renderBattleStatus("disconnected", "Synchronisation impossible");
    renderCharacterUnavailable("Synchronisation impossible");

    if (!blizzardCharacters.length) {
      charactersList.innerHTML = `
        <div class="characters-empty">
          Impossible de charger les personnages Battle.net.
        </div>
      `;
    }
  } finally {
    charactersSyncInProgress = false;
    syncCharactersButton?.classList.remove("is-syncing");
    syncCharactersButton?.removeAttribute("disabled");
    syncCharactersButton?.removeAttribute("aria-busy");
  }
}

syncCharactersButton?.addEventListener("click", () => {
  loadCharacters({ manual: true });
});


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

  const displayedCharacters = characters
    .slice()
    .sort((a, b) => Number(isCurrentCharacter(b)) - Number(isCurrentCharacter(a)))
    .slice(0, 4);

  displayedCharacters.forEach((character) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-hero-card";
    button.classList.toggle("is-active", isCurrentCharacter(character));
    button.style.setProperty("--home-class-color", character.classColor);
    button.innerHTML = `
      <span class="home-card-comet home-card-comet-one" aria-hidden="true"></span>
      <span class="home-card-comet home-card-comet-two" aria-hidden="true"></span>
      <img src="${character.image}" alt="" />
      <strong>${character.name}</strong>
      <small>Niv. ${character.level} · ${character.className}</small>
    `;
    button.addEventListener("click", () => openCharacterProfile(character));
    strip.appendChild(button);
  });

  const placeholderCount = Math.max(0, 4 - displayedCharacters.length);
  for (let index = 0; index < placeholderCount; index += 1) {
    const placeholder = document.createElement("div");
    placeholder.className = "home-hero-card home-hero-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.innerHTML = `
      <span class="home-hero-placeholder-medallion"></span>
      <strong>Héros à découvrir</strong>
      <small>Synchronisation Battle.net</small>
    `;
    strip.appendChild(placeholder);
  }
}

function renderHomeDashboardAccount(characters, dashboardSummary = null) {
  const realCharacters = characters.filter((character) => !character.isShowcase);
  const fallbackCollectorList = [...collectorCharacters.values()];
  const fallbackSessions = fallbackCollectorList.flatMap((character) =>
    Array.isArray(character?.sessions) ? character.sessions : [],
  );
  const summary = dashboardSummary || {
    characterCount: realCharacters.length,
    totalLevels: realCharacters.reduce(
      (total, character) => total + (Number(character.level) || 0),
      0,
    ),
    sessionCount: fallbackSessions.length,
    uniqueZoneCount: 0,
    weekPlaySeconds: 0,
    latestLocations: [],
  };
  const weekLabel = formatCollectorDuration(summary.weekPlaySeconds || 0);

  const values = {
    accountCharactersCount: summary.characterCount,
    accountLevelsTotal: summary.totalLevels,
    accountSessionsCount: summary.sessionCount,
    accountZonesCount: summary.uniqueZoneCount,
    accountWeekTime: weekLabel,
    activityWeekTime: weekLabel,
    activitySessionsCount: summary.sessionCount,
    activityZonesCount: summary.uniqueZoneCount,
    activityHeroesCount: summary.characterCount,
    timelineCharacters: `${summary.characterCount} personnage${summary.characterCount > 1 ? "s" : ""} Battle.net`,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  renderHomeLocations(summary.latestLocations || []);
  renderHomeHeroes(realCharacters);
}

function escapeHomeJournalText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatJournalMoment(timestamp) {
  const date = new Date(Number(timestamp || 0) * 1000);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("fr-CA", {
    day: "2-digit",
    month: "short",
  });
}

function journalLocationLabel(location) {
  if (!location) return "";
  return [location.subZone, location.zone]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ");
}

function journalEventPresentation(event) {
  const character = event.characterName || "Personnage inconnu";
  const location = journalLocationLabel(event.location);

  if (event.type === "SESSION_ACTIVE") {
    return {
      icon: "icon-location",
      title: `${character} est en aventure`,
      detail: location || "Session actuellement active",
    };
  }

  if (event.type === "TRAVEL_RECORDED") {
    const from = journalLocationLabel(event.fromLocation);
    return {
      icon: "icon-map",
      title: `${character} a voyagé`,
      detail: from && location ? `${from} → ${location}` : location || from || "Déplacement enregistré",
    };
  }

  if (event.type === "SESSION_ENDED") {
    const duration = formatCollectorDuration(event.durationSeconds || 0);
    return {
      icon: "icon-clock",
      title: `${character} a terminé sa session`,
      detail: [duration, location].filter(Boolean).join(" · ") || "Session enregistrée",
    };
  }

  return {
    icon: "icon-journal",
    title: `${character} s’est connecté`,
    detail: location || "Début d’une nouvelle aventure",
  };
}

function renderHomeJournal(events) {
  const timeline = document.getElementById("homeTimeline");
  if (!timeline) return;

  if (!Array.isArray(events) || !events.length) {
    timeline.innerHTML = `<div class="home-empty-state">
      <strong>Aucune session enregistrée</strong>
      <small>Connecte-toi en jeu avec le Collector actif, puis fais /reload ou déconnecte-toi.</small>
    </div>`;
    return;
  }

  timeline.innerHTML = events.slice(0, 5).map((event) => {
    const presentation = journalEventPresentation(event);
    return `<div class="timeline-item">
      <time>${escapeHomeJournalText(formatJournalMoment(event.timestamp))}</time>
      <span class="timeline-icon"><svg><use href="#${presentation.icon}"></use></svg></span>
      <div>
        <strong>${escapeHomeJournalText(presentation.title)}</strong>
        <small>${escapeHomeJournalText(presentation.detail)}</small>
      </div>
    </div>`;
  }).join("");
}

function renderHomeAchievements(achievements) {
  const container = document.getElementById("homeAchievementsList");
  if (!container) return;

  if (!Array.isArray(achievements) || !achievements.length) {
    container.innerHTML = `<div class="home-empty-state">
      <span class="achievement-icon"><svg><use href="#icon-trophy"></use></svg></span>
      <strong>Aucune réussite synchronisée</strong>
      <small>Obtiens un haut fait en jeu avec le Collector actif, puis fais /reload ou déconnecte-toi.</small>
    </div>`;
    return;
  }

  container.innerHTML = achievements.slice(0, 3).map((achievement) => {
    const detail = [
      achievement.description,
      achievement.characterName ? `Obtenu par ${achievement.characterName}` : "",
    ].filter(Boolean).join(" · ");

    return `<div class="achievement-row">
      <span class="achievement-icon"><svg><use href="#icon-trophy"></use></svg></span>
      <div>
        <strong>${escapeHomeJournalText(achievement.name || "Haut fait obtenu")}</strong>
        <small>${escapeHomeJournalText(detail || formatJournalMoment(achievement.earnedAt))}</small>
      </div>
      <b>${escapeHomeJournalText(achievement.points || 0)}</b>
    </div>`;
  }).join("");
}

function renderHomeLocations(locations) {
  const map = document.querySelector(".locations-map");
  if (!map) return;

  if (!Array.isArray(locations) || !locations.length) {
    map.innerHTML = `<div class="home-empty-state">
      <strong>Aucun lieu enregistré</strong>
      <small>Le Collector ajoutera ici les derniers endroits visités.</small>
    </div>`;
    return;
  }

  map.innerHTML = locations.slice(0, 3).map((entry, index) => {
    const label = [entry.location?.subZone, entry.location?.zone]
      .filter(Boolean)
      .join(" · ") || "Lieu enregistré";
    return `<div class="map-pin pin-${["one", "two", "three"][index] || "one"}">
      <svg><use href="#icon-location"></use></svg>
      <span>${label}</span>
    </div>`;
  }).join("");
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

    if (response.status === 401) {
      professionsElement.textContent =
        "Reconnecte Battle.net pour actualiser les métiers.";
      return;
    }

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
    console.warn(error.message || error);

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

// ======================================================
// Collector 2.0 - Vue Quêtes
// ======================================================

const questsState = {
  loaded: false,
  loading: false,
  payload: null,
  selectedKey: "",
  historyPage: 1,
  historyPageSize: 40,
  detailIndex: new Map(),
  database: null,
  databasePromise: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function questCharacterKey(character) {
  return String(character?.identityKey || `${character?.name || ""}-${character?.realm || ""}`)
    .normalize("NFKC")
    .toLowerCase();
}

function formatQuestDate(timestamp) {
  const value = Number(timestamp || 0);
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function getSelectedQuestCharacter() {
  if (questsState.selectedKey === "__account__") {
    return questsState.payload?.account || null;
  }

  const characters = questsState.payload?.characters || [];
  return characters.find((character) => questCharacterKey(character) === questsState.selectedKey)
    || characters[0]
    || questsState.payload?.account
    || null;
}

function findLastConnectedQuestCharacter() {
  const characters = questsState.payload?.characters || [];
  const lastCharacter = getLastCollectorCharacter();
  if (!lastCharacter || !characters.length) return null;

  const lastName = normalizeCollectorIdentity(lastCharacter.name);
  const lastRealm = normalizeCollectorIdentity(lastCharacter.realm);

  return characters.find((character) =>
    normalizeCollectorIdentity(character?.name) === lastName
      && normalizeCollectorIdentity(character?.realm) === lastRealm,
  ) || characters.find((character) =>
    normalizeCollectorIdentity(character?.name) === lastName,
  ) || null;
}

function selectLastConnectedQuestCharacter() {
  const character = findLastConnectedQuestCharacter();
  if (!character) return false;
  questsState.selectedKey = questCharacterKey(character);
  questsState.historyPage = 1;
  return true;
}

function renderQuestCharacterOptions() {
  const select = document.getElementById("questsCharacterSelect");
  if (!select) return;

  const characters = [...(questsState.payload?.characters || [])].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }),
  );

  const characterOptions = characters
    .map((character) => {
      const key = questCharacterKey(character);
      return `<option value="${escapeHtml(key)}">${escapeHtml(character.name)} — ${escapeHtml(character.realm)}</option>`;
    })
    .join("");

  const accountOption = questsState.payload?.account
    ? '<option value="__account__">Compte — Bande de guerre</option>'
    : "";

  select.innerHTML = characterOptions + accountOption;

  if (!questsState.selectedKey && characters[0]) {
    questsState.selectedKey = questCharacterKey(characters[0]);
  } else if (!questsState.selectedKey && questsState.payload?.account) {
    questsState.selectedKey = "__account__";
  }

  const validValues = new Set([...select.options].map((option) => option.value));
  if (!validValues.has(questsState.selectedKey)) {
    questsState.selectedKey = characters[0]
      ? questCharacterKey(characters[0])
      : questsState.payload?.account ? "__account__" : "";
  }
  select.value = questsState.selectedKey;
}

function normalizeQuestHistoryTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fr");
}

function groupQuestHistoryByTitle(quests = []) {
  const groups = new Map();

  quests.forEach((quest) => {
    const fallbackTitle = `Quête #${Number(quest?.id || 0)}`;
    const title = String(quest?.title || fallbackTitle).trim() || fallbackTitle;
    const normalizedTitle = normalizeQuestHistoryTitle(title);
    const key = normalizedTitle || `quest-id:${Number(quest?.id || 0)}`;

    if (!groups.has(key)) {
      groups.set(key, {
        title,
        mapName: quest?.mapName || "",
        quests: [],
        ids: [],
      });
    }

    const group = groups.get(key);
    const questId = Number(quest?.id || 0);
    group.quests.push(quest);
    if (questId && !group.ids.includes(questId)) group.ids.push(questId);
    if (!group.mapName && quest?.mapName) group.mapName = quest.mapName;
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      ids: group.ids.sort((a, b) => a - b),
      variantCount: group.ids.length || group.quests.length,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));
}

function getQuestTypeLabel(quest, isAccountView = false) {
  if (isAccountView || quest?.scope === "account" || quest?.isAccountQuest) return "Bande de guerre";
  if (quest?.isPetBattleQuest) return "Combat de mascottes";
  if (quest?.isWorldQuest) return "Quête mondiale";
  if (quest?.campaignID) return "Campagne";
  if (quest?.isCalling) return "Appel";
  return "Quête personnelle";
}

function closeQuestDetails() {
  const panel = document.getElementById("questDetailsPanel");
  const backdrop = document.getElementById("questDetailsBackdrop");
  if (!panel || !backdrop) return;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  document.body.classList.remove("quest-details-open");
}


async function loadQuestDatabase() {
  if (questsState.database) return questsState.database;
  if (questsState.databasePromise) return questsState.databasePromise;

  questsState.databasePromise = fetch("/data/quests/quest-database.json", {
    headers: { Accept: "application/json" },
    cache: "no-cache",
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Quest Database indisponible (${response.status})`);
      return response.json();
    })
    .then((payload) => {
      questsState.database = payload?.quests && typeof payload.quests === "object" ? payload.quests : {};
      return questsState.database;
    })
    .catch((error) => {
      console.warn("Quest Database non chargée :", error.message);
      questsState.database = {};
      return questsState.database;
    });

  return questsState.databasePromise;
}

function firstUsefulValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function mergeQuestKnowledge(liveQuest = {}, databaseQuest = {}) {
  const liveRewards = liveQuest.rewards && typeof liveQuest.rewards === "object" ? liveQuest.rewards : {};
  const databaseRewards = databaseQuest.rewards && typeof databaseQuest.rewards === "object" ? databaseQuest.rewards : {};

  return {
    ...databaseQuest,
    ...liveQuest,
    title: firstUsefulValue(liveQuest.title, databaseQuest.title),
    description: firstUsefulValue(liveQuest.description, liveQuest.questDescription, liveQuest.logDescription, databaseQuest.description),
    objectiveText: firstUsefulValue(liveQuest.objectiveText, liveQuest.objectivesText, databaseQuest.objectiveText),
    completionText: firstUsefulValue(liveQuest.completionText, databaseQuest.completionText),
    mapName: firstUsefulValue(liveQuest.mapName, databaseQuest.mapName),
    rewards: {
      ...databaseRewards,
      ...liveRewards,
      experience: Number(liveRewards.experience || databaseRewards.experience || 0),
      money: Number(liveRewards.money || databaseRewards.money || 0),
      items: Array.isArray(liveRewards.items) && liveRewards.items.length ? liveRewards.items : (Array.isArray(databaseRewards.items) ? databaseRewards.items : []),
      choices: Array.isArray(liveRewards.choices) && liveRewards.choices.length ? liveRewards.choices : (Array.isArray(databaseRewards.choices) ? databaseRewards.choices : []),
      currencies: Array.isArray(liveRewards.currencies) && liveRewards.currencies.length ? liveRewards.currencies : (Array.isArray(databaseRewards.currencies) ? databaseRewards.currencies : []),
    },
    knowledgeSource: databaseQuest.source || "",
  };
}

function formatQuestMoney(totalCopper) {
  const total = Math.max(0, Number(totalCopper || 0));
  const gold = Math.floor(total / 10000);
  const silver = Math.floor((total % 10000) / 100);
  const copper = total % 100;
  const parts = [];
  if (gold) parts.push(`<span class="quest-money-part"><span class="quest-money-icon gold">●</span>${gold}</span>`);
  if (silver) parts.push(`<span class="quest-money-part"><span class="quest-money-icon silver">●</span>${silver}</span>`);
  if (copper || !parts.length) parts.push(`<span class="quest-money-part"><span class="quest-money-icon copper">●</span>${copper}</span>`);
  return parts.join("");
}

function questRewardTypeLabel(item = {}) {
  if (item.typeLabel) return String(item.typeLabel);
  if (item.currencyID) return "Monnaie";
  if (item.isQuestItem || item.questItem) return "Objet de quête";
  if (item.itemLevel) return `Niveau d’objet : ${Number(item.itemLevel)}`;
  return "Objet";
}

function renderQuestRewardItem(item, options = {}) {
  const quality = Math.max(0, Math.min(7, Number(item?.quality || 0)));
  const quantity = Math.max(1, Number(item?.quantity || 1));
  const name = item?.name || (item?.itemID ? `Objet #${item.itemID}` : "Objet de récompense");
  const texture = item?.iconUrl || item?.texture;
  const icon = typeof texture === "string" && /^(https?:|\/)/i.test(texture)
    ? `<img src="${escapeHtml(texture)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : `<span class="quest-reward-icon-fallback">◆</span>`;
  const typeLabel = questRewardTypeLabel(item);
  const choiceClass = options.isChoice ? " is-choice" : "";

  return `<article class="quest-reward-item quality-${quality}${choiceClass}">
    <span class="quest-reward-icon">${icon}${quantity > 1 ? `<em>${quantity}</em>` : ""}</span>
    <span class="quest-reward-item-copy">
      <strong>${escapeHtml(name)}</strong>
      <small>${escapeHtml(typeLabel)}</small>
      ${item?.binding ? `<small>${escapeHtml(item.binding)}</small>` : ""}
    </span>
  </article>`;
}

function renderQuestRewards(rewards = {}) {
  const experience = Math.max(0, Number(rewards.experience || 0));
  const money = Math.max(0, Number(rewards.money || 0));
  const items = Array.isArray(rewards.items) ? rewards.items : [];
  const choices = Array.isArray(rewards.choices) ? rewards.choices : [];
  const currencies = Array.isArray(rewards.currencies) ? rewards.currencies : [];
  const spell = rewards.spell && typeof rewards.spell === "object" ? rewards.spell : null;
  const artifactXP = Math.max(0, Number(rewards.artifactXP || 0));
  const summary = [];
  const groups = [];

  if (experience > 0) summary.push(`<div class="quest-reward-summary-item"><span class="quest-reward-symbol xp">✦</span><span><strong>${experience.toLocaleString("fr-CA")} XP</strong><small>Expérience</small></span></div>`);
  if (money > 0) summary.push(`<div class="quest-reward-summary-item"><span class="quest-reward-symbol coins">●</span><span><strong class="quest-money">${formatQuestMoney(money)}</strong><small>Argent</small></span></div>`);
  if (artifactXP > 0) summary.push(`<div class="quest-reward-summary-item"><span class="quest-reward-symbol xp">◆</span><span><strong>${artifactXP.toLocaleString("fr-CA")}</strong><small>Puissance prodigieuse</small></span></div>`);

  if (items.length) groups.push(`<div class="quest-reward-group"><h5>Récompenses garanties</h5><div class="quest-reward-items">${items.map((item) => renderQuestRewardItem(item)).join("")}</div></div>`);
  if (choices.length) groups.push(`<div class="quest-reward-group"><h5>Choisis une récompense</h5><div class="quest-reward-choice-grid">${choices.map((item) => renderQuestRewardItem(item, { isChoice: true })).join("")}</div></div>`);
  if (currencies.length) groups.push(`<div class="quest-reward-group"><h5>Monnaies</h5><div class="quest-reward-items">${currencies.map((currency) => renderQuestRewardItem({ ...currency, itemID: currency.currencyID })).join("")}</div></div>`);
  if (spell?.name) groups.push(`<div class="quest-reward-group"><h5>Apprentissage</h5><div class="quest-reward-items"><div class="quest-reward-summary-item"><span class="quest-reward-symbol xp">✧</span><span><strong>${escapeHtml(spell.name)}</strong><small>Sort ou technique appris</small></span></div></div></div>`);

  if (!summary.length && !groups.length) return '<p class="quest-details-muted">Aucune récompense détaillée fournie par WoW pour cette quête.</p>';
  return `<div class="quest-rewards-premium">${summary.length ? `<div class="quest-reward-summary">${summary.join("")}</div>` : ""}${groups.join("")}</div>`;
}

function cleanQuestObjectiveText(value, total = 0) {
  let text = String(value || "Objectif");
  const usePlural = Number(total) !== 1;

  text = text
    .replace(/\|c[0-9a-fA-F]{8}/g, "")
    .replace(/\|r/g, "")
    .replace(/(?:\||[lI])4([^:;]+):([^;]+);/g, (_, singular, plural) =>
      usePlural ? plural : singular,
    )
    .replace(/(?:\||[lI])[Kk](\d+)/g, "$1")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/\s*[:\-–]\s*\d+\s*\/\s*\d+(?=\s|$)/g, "")
    .replace(/\s+\d+\s*\/\s*\d+(?=\s|$)/g, "")
    .replace(/\s*[:\-–;,]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Objectif";
}

function parseQuestObjectiveProgress(objective = {}) {
  const rawText = String(objective.text || "Objectif");
  let current = Number(firstUsefulValue(objective.current, objective.fulfilled, objective.numFulfilled));
  let total = Number(firstUsefulValue(objective.total, objective.required, objective.numRequired));
  const progressMatch = rawText.match(/(\d+)\s*\/\s*(\d+)/);

  if ((!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) && progressMatch) {
    current = Number(progressMatch[1]);
    total = Number(progressMatch[2]);
  }

  if (!Number.isFinite(current)) current = objective.finished ? 1 : 0;
  if (!Number.isFinite(total) || total < 0) total = 0;

  return {
    text: cleanQuestObjectiveText(rawText, total),
    current,
    total,
  };
}

function renderQuestObjective(objective = {}) {
  const progress = parseQuestObjectiveProgress(objective);
  const done = Boolean(objective.finished || (progress.total > 0 && progress.current >= progress.total));
  const ratio = progress.total > 0
    ? Math.min(100, Math.max(0, (progress.current / progress.total) * 100))
    : (done ? 100 : 0);

  return `<li class="quest-details-objective ${done ? "done" : ""}">
    <span class="quest-objective-check" aria-hidden="true">${done ? "✓" : ""}</span>
    <span class="quest-objective-body">
      <strong>${escapeHtml(progress.text)}</strong>
      ${progress.total > 0 ? `<span class="quest-objective-progress" aria-hidden="true"><i style="width:${ratio}%"></i></span><small>${progress.current} / ${progress.total}</small>` : ""}
    </span>
  </li>`;
}

function renderQuestTravel(quest, location) {
  const coordinates = quest.coordinates || quest.coords || quest.position || null;
  const x = Number(firstUsefulValue(coordinates?.x, quest.x, quest.mapX));
  const y = Number(firstUsefulValue(coordinates?.y, quest.y, quest.mapY));
  const hasCoordinates = Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0;
  const giver = firstUsefulValue(quest.giverName, quest.questGiver, quest.startNpcName, quest.npcName);
  const turnIn = firstUsefulValue(quest.turnInName, quest.endNpcName, quest.completionNpcName);

  return `<section class="quest-details-section quest-travel-section">
    <h4>Où aller</h4>
    <div class="quest-travel-card">
      <div><span>Zone</span><strong>${escapeHtml(location)}</strong></div>
      ${giver ? `<div><span>Donneur de quête</span><strong>${escapeHtml(giver)}</strong></div>` : ""}
      ${turnIn ? `<div><span>Remise de quête</span><strong>${escapeHtml(turnIn)}</strong></div>` : ""}
      <div><span>Coordonnées</span><strong>${hasCoordinates ? `${x.toFixed(1)}, ${y.toFixed(1)}` : "Non disponibles"}</strong></div>
      <button class="quest-map-button" type="button" ${hasCoordinates ? `data-quest-coordinates="${x.toFixed(1)},${y.toFixed(1)}"` : "disabled"}>${hasCoordinates ? "Copier les coordonnées" : "Carte interactive — prochainement"}</button>
    </div>
  </section>`;
}

function renderQuestBlizzardData({ ids, typeLabel, level, location, quest }) {
  const category = firstUsefulValue(quest.category, quest.questCategory, "Normale");
  const expansion = firstUsefulValue(quest.expansionName, quest.expansion);
  const faction = firstUsefulValue(quest.factionName, quest.faction);
  const knownLocation = location && location !== "Zone non précisée";
  const rows = [
    `<div><dt>Quest ID</dt><dd>${escapeHtml(ids.join(", "))}</dd></div>`,
    `<div><dt>Type</dt><dd>${escapeHtml(typeLabel)}</dd></div>`,
    `<div><dt>Niveau</dt><dd>${level > 0 ? level : "Adaptatif"}</dd></div>`,
    `<div><dt>Catégorie</dt><dd>${escapeHtml(String(category))}</dd></div>`,
    expansion ? `<div><dt>Extension</dt><dd>${escapeHtml(String(expansion))}</dd></div>` : "",
    faction ? `<div><dt>Faction</dt><dd>${escapeHtml(String(faction))}</dd></div>` : "",
    knownLocation ? `<div class="wide"><dt>Zone</dt><dd>${escapeHtml(location)}</dd></div>` : "",
  ].filter(Boolean).join("");

  return `<section class="quest-details-section quest-details-technical">
    <h4>Informations Blizzard</h4>
    <dl class="quest-data-grid">${rows}</dl>
  </section>`;
}

async function openQuestDetails(detailKey) {
  const detail = questsState.detailIndex.get(detailKey);
  const panel = document.getElementById("questDetailsPanel");
  const backdrop = document.getElementById("questDetailsBackdrop");
  const content = document.getElementById("questDetailsContent");
  if (!detail || !panel || !backdrop || !content) return;

  const liveQuest = detail.quest || {};
  const ids = Array.isArray(detail.ids) ? detail.ids : [Number(liveQuest.id || 0)].filter(Boolean);
  const database = await loadQuestDatabase();
  const databaseQuest = ids.map((id) => database[String(id)]).find(Boolean) || {};
  const quest = mergeQuestKnowledge(liveQuest, databaseQuest);
  const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
  const location = quest.mapName || detail.mapName || "Zone non précisée";
  const typeLabel = getQuestTypeLabel(quest, detail.isAccountView);
  const level = Number(quest.level || 0);
  const suggestedGroup = Number(quest.suggestedGroup || 0);
  const description = quest.description || quest.questDescription || quest.logDescription || "";
  const objectiveText = quest.objectiveText || quest.objectivesText || "";
  const completionText = quest.completionText || "";

  content.innerHTML = `
    <h3 id="questDetailsTitle" class="quest-details-title">${escapeHtml(detail.title || quest.title || `Quête #${ids[0] || 0}`)}</h3>
    <div class="quest-details-meta">
      ${ids.length ? `<span class="quest-details-chip">${ids.length > 1 ? `${ids.length} variantes` : `#${ids[0]}`}</span>` : ""}
      <span class="quest-details-chip">${escapeHtml(location)}</span>
      <span class="quest-details-chip">${escapeHtml(typeLabel)}</span>
      ${level > 0 ? `<span class="quest-details-chip">Niveau ${level}</span>` : ""}
      ${suggestedGroup > 0 ? `<span class="quest-details-chip">Groupe conseillé : ${suggestedGroup}</span>` : ""}
      ${quest.isComplete ? '<span class="quest-details-chip">Terminée dans le journal</span>' : ""}
      ${quest.knowledgeSource ? '<span class="quest-details-chip quest-details-chip-source">Base Azer Companion</span>' : ""}
    </div>

    <section class="quest-details-section">
      <h4>Description</h4>
      ${description ? `<p class="quest-details-copy">${escapeHtml(description)}</p>` : '<p class="quest-details-muted">WoW ne fournit pas de description pour cette entrée.</p>'}
      ${completionText ? `<p class="quest-details-copy quest-completion-copy">${escapeHtml(completionText)}</p>` : ""}
    </section>

    <section class="quest-details-section">
      <h4>Objectifs</h4>
      ${objectiveText ? `<p class="quest-details-copy quest-objective-summary">${escapeHtml(objectiveText)}</p>` : ""}
      ${objectives.length ? `<ul class="quest-details-objectives">${objectives.map(renderQuestObjective).join("")}</ul>` : '<p class="quest-details-muted">Aucun objectif détaillé disponible.</p>'}
    </section>

    <section class="quest-details-section">
      <h4>Récompenses</h4>
      ${renderQuestRewards(quest.rewards || {})}
    </section>

    ${renderQuestTravel(quest, location)}
    ${ids.length ? renderQuestBlizzardData({ ids, typeLabel, level, location, quest }) : ""}
  `;

  content.querySelector("[data-quest-coordinates]")?.addEventListener("click", async (event) => {
    const value = event.currentTarget.dataset.questCoordinates;
    try {
      await navigator.clipboard.writeText(value);
      event.currentTarget.textContent = "Coordonnées copiées ✓";
    } catch {
      event.currentTarget.textContent = value;
    }
  });

  backdrop.hidden = false;
  panel.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => panel.classList.add("is-open"));
  document.body.classList.add("quest-details-open");
  document.getElementById("questDetailsClose")?.focus({ preventScroll: true });
}

function bindQuestDetailsTriggers(root) {
  if (!root) return;
  root.querySelectorAll("[data-quest-detail-key]").forEach((element) => {
    const open = () => openQuestDetails(element.dataset.questDetailKey);
    element.addEventListener("click", open);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function renderQuestsView() {
  const grid = document.getElementById("questsGrid");
  const completedList = document.getElementById("questsCompletedList");
  if (!grid || !completedList) return;

  renderQuestCharacterOptions();
  const character = getSelectedQuestCharacter();
  const isAccountView = questsState.selectedKey === "__account__";
  questsState.detailIndex = new Map();
  const active = [...(character?.active || [])];
  const observed = [...(character?.completedObserved || [])].sort(
    (a, b) => Number(b.completedAt || 0) - Number(a.completedAt || 0),
  );
  const history = [...(character?.completedHistory || [])].sort((a, b) => {
    const firstTitle = String(a.title || "");
    const secondTitle = String(b.title || "");
    if (firstTitle && secondTitle) {
      return firstTitle.localeCompare(secondTitle, "fr", { sensitivity: "base" });
    }
    return Number(a.id || 0) - Number(b.id || 0);
  });
  const groupedHistory = groupQuestHistoryByTitle(history);
  const remainingObjectives = active.reduce(
    (total, quest) => total + (quest.objectives || []).filter((objective) => !objective.finished).length,
    0,
  );

  document.getElementById("questsActiveCount").textContent = String(active.length);
  document.getElementById("questsObjectivesCount").textContent = String(remainingObjectives);
  document.getElementById("questsCompletedCount").textContent = String(groupedHistory.length);
  const accountShared = [...(questsState.payload?.account?.completedHistory || [])];
  const accountSharedCount = document.getElementById("questsAccountSharedCount");
  if (accountSharedCount) accountSharedCount.textContent = String(groupQuestHistoryByTitle(accountShared).length);

  const completedHeading = document.getElementById("questsCompletedHeading");
  if (completedHeading) {
    completedHeading.textContent = isAccountView
      ? "Quêtes terminées du compte — Bande de guerre"
      : "Historique personnel des quêtes terminées";
  }

  const activeLabel = document.getElementById("questsActiveLabel");
  const objectivesLabel = document.getElementById("questsObjectivesLabel");
  const completedLabel = document.getElementById("questsCompletedLabel");
  const accountLabel = document.getElementById("questsAccountSharedLabel");
  if (activeLabel) activeLabel.textContent = isAccountView ? "Quêtes actives du compte" : "Quêtes actives";
  if (objectivesLabel) objectivesLabel.textContent = isAccountView ? "Objectifs du compte" : "Objectifs à terminer";
  if (completedLabel) completedLabel.textContent = isAccountView ? "Titres uniques du compte" : "Titres uniques personnels";
  if (accountLabel) accountLabel.textContent = "Titres partagés du compte";

  if (!character) {
    grid.innerHTML = '<div class="quest-empty"><strong>Aucune donnée de quête</strong><br><small>Lance /azer scan dans WoW, puis /reload.</small></div>';
    completedList.innerHTML = '<div class="quest-empty">Aucun historique disponible.</div>';
    return;
  }

  grid.innerHTML = active.length
    ? active
        .sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "fr"))
        .map((quest, index) => {
          const objectives = quest.objectives || [];
          const location = quest.mapName || "Zone non précisée";
          const detailKey = `active:${Number(quest.id || 0)}:${index}`;
          questsState.detailIndex.set(detailKey, { quest, title: quest.title || `Quête #${quest.id}`, ids: [Number(quest.id || 0)].filter(Boolean), mapName: location, isAccountView });
          return `
            <article class="quest-card ${quest.isComplete ? "is-complete" : ""}" data-quest-detail-key="${escapeHtml(detailKey)}" tabindex="0" role="button" aria-label="Voir les détails de ${escapeHtml(quest.title || `Quête ${quest.id}`)}">
              <h3>${escapeHtml(quest.title || `Quête ${quest.id}`)}</h3>
              <div class="quest-card-meta">
                <span>#${Number(quest.id || 0)}</span>
                <span>${escapeHtml(location)}</span>
                ${isAccountView ? "<span>Bande de guerre</span>" : ""}
                ${quest.isWorldQuest ? "<span>Quête mondiale</span>" : ""}
                ${quest.campaignID ? "<span>Campagne</span>" : ""}
              </div>
              <ul class="quest-objectives">
                ${objectives.length
                  ? objectives.map((objective) => `<li class="${objective.finished ? "done" : ""}">${escapeHtml(objective.text || "Objectif")}</li>`).join("")
                  : "<li>Aucun objectif détaillé fourni par WoW.</li>"}
              </ul>
            </article>`;
        })
        .join("")
    : isAccountView
      ? '<div class="quest-empty"><strong>Aucune quête active partagée détectée</strong><br><small>Les quêtes de compte apparaîtront ici après les scans des personnages.</small></div>'
      : '<div class="quest-empty"><strong>Aucune quête personnelle active pour ce personnage</strong><br><small>Les quêtes de Bande de guerre sont visibles dans la vue Compte.</small></div>';

  const totalPages = Math.max(1, Math.ceil(groupedHistory.length / questsState.historyPageSize));
  questsState.historyPage = Math.min(Math.max(1, questsState.historyPage), totalPages);
  const firstIndex = (questsState.historyPage - 1) * questsState.historyPageSize;
  const pageItems = groupedHistory.slice(firstIndex, firstIndex + questsState.historyPageSize);

  const historyHtml = pageItems.length
    ? pageItems.map((group, index) => {
        const idsLabel = group.ids.map((id) => `#${id}`).join(", ");
        const variantLabel = group.variantCount > 1
          ? `${group.variantCount} variantes`
          : idsLabel || "1 quête";
        const detailKey = `history:${questsState.historyPage}:${index}:${group.ids[0] || 0}`;
        questsState.detailIndex.set(detailKey, { quest: group.quests[0] || {}, title: group.title, ids: group.ids, mapName: group.mapName, isAccountView });
        return `
          <div class="quest-history-item" data-quest-detail-key="${escapeHtml(detailKey)}" tabindex="0" role="button" title="${escapeHtml(idsLabel)}">
            <strong>${escapeHtml(group.title)}</strong>
            <span>${escapeHtml(group.mapName || character.realm)} · ${escapeHtml(variantLabel)}</span>
          </div>`;
      }).join("")
    : isAccountView
      ? '<div class="quest-empty">Aucune quête partagée du compte n’a encore été détectée.</div>'
      : '<div class="quest-empty">Aucune quête personnelle terminée détectée pour ce personnage. Les quêtes partagées sont disponibles dans « Compte — Bande de guerre ».</div>';

  const observedHtml = !isAccountView && observed.length
    ? `<div class="quest-observed-block">
        <h4>Dernières quêtes observées par le Collector</h4>
        ${observed.slice(0, 10).map((quest, index) => {
          const detailKey = `observed:${Number(quest.id || 0)}:${index}`;
          questsState.detailIndex.set(detailKey, { quest, title: quest.title || `Quête #${quest.id}`, ids: [Number(quest.id || 0)].filter(Boolean), mapName: quest.mapName || "", isAccountView: false });
          return `
          <div class="quest-history-item is-observed" data-quest-detail-key="${escapeHtml(detailKey)}" tabindex="0" role="button">
            <strong>${escapeHtml(quest.title || `Quête #${quest.id}`)}</strong>
            <span>${formatQuestDate(quest.completedAt)}</span>
          </div>`;
        }).join("")}
      </div>`
    : "";

  const paginationHtml = groupedHistory.length > questsState.historyPageSize
    ? `<div class="quest-pagination">
        <button type="button" data-quest-page="${questsState.historyPage - 1}" ${questsState.historyPage <= 1 ? "disabled" : ""}>← Précédent</button>
        <span>Page ${questsState.historyPage} sur ${totalPages} · ${groupedHistory.length} titres uniques (${history.length} IDs)</span>
        <button type="button" data-quest-page="${questsState.historyPage + 1}" ${questsState.historyPage >= totalPages ? "disabled" : ""}>Suivant →</button>
      </div>`
    : groupedHistory.length
      ? `<div class="quest-pagination"><span>${groupedHistory.length} titres uniques · ${history.length} IDs de quête conservés</span></div>`
      : "";

  completedList.innerHTML = historyHtml + paginationHtml + observedHtml;
  bindQuestDetailsTriggers(grid);
  bindQuestDetailsTriggers(completedList);
  completedList.querySelectorAll("[data-quest-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.questPage || 1);
      if (nextPage < 1 || nextPage > totalPages) return;
      questsState.historyPage = nextPage;
      renderQuestsView();
      completedList.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

async function loadQuests(force = false) {
  if (questsState.loading || (questsState.loaded && !force)) {
    renderQuestsView();
    return;
  }

  questsState.loading = true;
  const grid = document.getElementById("questsGrid");
  if (grid) grid.innerHTML = '<div class="quest-empty">Chargement des quêtes...</div>';

  try {
    const response = await fetch(`/api/quests?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Quêtes indisponibles.");
    questsState.payload = await response.json();
    questsState.loaded = true;
    renderQuestsView();
  } catch (error) {
    console.warn(error.message || error);
    if (grid) grid.innerHTML = '<div class="quest-empty"><strong>Impossible de lire les quêtes</strong><br><small>Vérifie le SavedVariables et relance la synchronisation.</small></div>';
  } finally {
    questsState.loading = false;
  }
}

async function openQuestsView() {
  showView("quests");
  revealSidebar();
  await loadQuests();
  if (selectLastConnectedQuestCharacter()) renderQuestsView();
}

views.quests = document.getElementById("questsView");

document.getElementById("questsNav")?.addEventListener("click", (event) => {
  event.preventDefault();
  openQuestsView();
});

document.getElementById("questsRefreshButton")?.addEventListener("click", () => loadQuests(true));

document.getElementById("questsCharacterSelect")?.addEventListener("change", (event) => {
  questsState.selectedKey = event.target.value;
  questsState.historyPage = 1;
  renderQuestsView();
});

document.getElementById("questDetailsClose")?.addEventListener("click", closeQuestDetails);
document.getElementById("questDetailsBackdrop")?.addEventListener("click", closeQuestDetails);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQuestDetails();
});
