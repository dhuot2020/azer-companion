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
let profileImageMode = "full-body";
let profileCollectionData = null;
let activeProfileCollectionTab = "mounts";
let profileCollectionPage = 1;
let activeProfileCollectionTooltipKey = "";
let profileCollectionModalTrigger = null;
let activeProfileCollectionModalKey = "";
const profileCollectionDetails = new Map();
const PROFILE_COLLECTION_PAGE_SIZE = 20;

const PROFILE_IMAGE_DEFAULT_VIEW = {
  // Le rendu Blizzard "main" contient beaucoup d'espace vide autour du modèle.
  // 1.72 donne un cadrage plein corps proche de l'armurerie WoW tout en gardant
  // la tête et les pieds visibles dans notre cadre 5:7.
  "full-body": { zoom: 2.28, x: 0, y: 2 },
  // Le portrait utilise maintenant le média Blizzard dédié (inset/bust).
  // À 100 %, l'image remplit déjà le cadre grâce à object-fit: cover.
  portrait: { zoom: 1, x: 0, y: 0 },
};

let profileImageDragState = null;

function getProfileImageViewStorageKey(character, mode) {
  const key = character ? getCharacterKey(character) : "unknown";
  // v2 uniquement pour le portrait : on ignore les anciens zooms (ex. 600 %)
  // qui avaient été enregistrés lorsque le portrait utilisait le main-raw.
  const storageMode = mode === "portrait" ? "portraitV2" : mode === "full-body" ? "fullBodyV9" : mode;
  return `azer.profileImageView.${key}.${storageMode}`;
}

function getProfileImageView(character, mode = profileImageMode) {
  const fallback = PROFILE_IMAGE_DEFAULT_VIEW[mode] || PROFILE_IMAGE_DEFAULT_VIEW["full-body"];

  try {
    const saved = JSON.parse(localStorage.getItem(getProfileImageViewStorageKey(character, mode)) || "null");
    if (saved && Number.isFinite(saved.zoom) && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return {
        zoom: Math.min(6, Math.max(0.65, saved.zoom)),
        x: Math.min(80, Math.max(-80, saved.x)),
        y: Math.min(80, Math.max(-80, saved.y)),
      };
    }
  } catch (_error) {
    // Une préférence de cadrage invalide ne doit jamais bloquer la fiche.
  }

  return { ...fallback };
}

function saveProfileImageView(character, mode, view) {
  if (!character) return;
  localStorage.setItem(
    getProfileImageViewStorageKey(character, mode),
    JSON.stringify(view),
  );
}

function applyProfileImageView() {
  const profileImage = document.getElementById("profileCharacterImage");
  const resetButton = document.querySelector('[data-profile-zoom="reset"]');
  if (!profileImage || !profiledCharacter) return;

  const view = getProfileImageView(profiledCharacter, profileImageMode);
  profileImage.style.setProperty("--profile-image-zoom", String(view.zoom));
  profileImage.style.setProperty("--profile-image-x", `${view.x}%`);
  profileImage.style.setProperty("--profile-image-y", `${view.y}%`);

  if (resetButton) {
    resetButton.textContent = `${Math.round(view.zoom * 100)}%`;
  }
}

function updateProfileImageView(patch) {
  if (!profiledCharacter) return;

  const current = getProfileImageView(profiledCharacter, profileImageMode);
  const next = {
    zoom: Math.min(6, Math.max(0.65, patch.zoom ?? current.zoom)),
    x: Math.min(80, Math.max(-80, patch.x ?? current.x)),
    y: Math.min(80, Math.max(-80, patch.y ?? current.y)),
  };

  saveProfileImageView(profiledCharacter, profileImageMode, next);
  applyProfileImageView();
}

function resetProfileImageView() {
  if (!profiledCharacter) return;
  const defaults = { ...(PROFILE_IMAGE_DEFAULT_VIEW[profileImageMode] || PROFILE_IMAGE_DEFAULT_VIEW["full-body"]) };
  saveProfileImageView(profiledCharacter, profileImageMode, defaults);
  applyProfileImageView();
}
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

function getWowClassIconUrl(iconName) {
  const slugs = {
    warrior: "warrior", paladin: "paladin", hunter: "hunter", rogue: "rogue", priest: "priest",
    "death-knight": "deathknight", shaman: "shaman", mage: "mage", warlock: "warlock", monk: "monk",
    druid: "druid", "demon-hunter": "demonhunter", evoker: "evoker",
  };
  const slug = slugs[iconName] || "warrior";
  return `https://wow.zamimg.com/images/wow/icons/medium/classicon_${slug}.jpg`;
}


function getWowIconUrl(iconName, size = "large") {
  const clean = String(iconName || "inv_misc_questionmark").toLowerCase();
  return `https://wow.zamimg.com/images/wow/icons/${size}/${clean}.jpg`;
}

function getWowRaceIconUrl(raceName = "") {
  const race = String(raceName).toLowerCase();
  const icons = {
    "orc": "achievement_character_orc_male",
    "elfe de sang": "achievement_character_bloodelf_female",
    "humain": "achievement_character_human_male",
    "nain": "achievement_character_dwarf_male",
    "elfe de la nuit": "achievement_character_nightelf_female",
    "mort-vivant": "achievement_character_undead_male",
    "tauren": "achievement_character_tauren_male",
    "gnome": "achievement_character_gnome_male",
    "troll": "achievement_character_troll_male",
    "gobelin": "achievement_character_goblin_male",
    "draeneï": "achievement_character_draenei_male",
    "worgen": "achievement_character_worgen_male",
    "pandaren": "achievement_character_pandaren_male",
  };
  return getWowIconUrl(icons[race] || "inv_misc_questionmark");
}

function getWowRealmIconUrl(realmName = "") {
  const realm = String(realmName).toLowerCase();
  if (realm.includes("silvermoon")) return getWowIconUrl("spell_arcane_teleportsilvermoon");
  return getWowIconUrl("inv_misc_map_01");
}

function getWowLevelIconUrl(level = 1) {
  const value = Number(level) || 1;
  const tier = value >= 80 ? 80 : value >= 70 ? 70 : value >= 60 ? 60 : value >= 50 ? 50 : value >= 40 ? 40 : value >= 30 ? 30 : value >= 20 ? 20 : 10;
  return getWowIconUrl(`achievement_level_${tier}`);
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
    // Pour la grande fiche du héros, on privilégie le portrait Blizzard
    // le plus grand (inset/bust) avant le petit avatar carré.
    getMediaAsset(character, "inset") ||
    character.media?.bust_url ||
    character.portraitUrl ||
    getMediaAsset(character, "avatar") ||
    character.avatarUrl ||
    character.avatar ||
    character.media?.avatar ||
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
    heroMedallion.style.setProperty("--home-class-color", character.classColor || "#4fa3ff");
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

function formatProfileNumber(value) {
  return new Intl.NumberFormat("fr-CA").format(Number(value || 0));
}

function getProfileCollectorCharacter(character) {
  return collectorCharacters.get(getCollectorCharacterKey(character)) || null;
}

function getProfessionIconUrl(professionName) {
  const name = String(professionName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const icons = [
    [/depecage|skinning/, "inv_misc_pelt_bear_03"],
    [/travail du cuir|leatherworking/, "trade_leatherworking"],
    [/alchimie|alchemy/, "trade_alchemy"],
    [/forge|blacksmith/, "trade_blacksmithing"],
    [/enchantement|enchanting/, "trade_engraving"],
    [/ingenierie|engineering/, "trade_engineering"],
    [/herboristerie|herbalism/, "spell_nature_naturetouchgrow"],
    [/calligraphie|inscription/, "inv_inscription_tradeskill01"],
    [/joaillerie|jewelcrafting/, "inv_misc_gem_01"],
    [/minage|mining/, "trade_mining"],
    [/couture|tailoring/, "trade_tailoring"],
    [/cuisine|cooking/, "inv_misc_food_15"],
    [/peche|fishing/, "trade_fishing"],
    [/archeologie|archaeology/, "trade_archaeology"],
  ];
  const match = icons.find(([pattern]) => pattern.test(name));
  return getWowIconUrl(match?.[1] || "inv_misc_questionmark", "medium");
}

function normalizeProfileProfessions(professions = []) {
  return professions.map((profession) => ({
    name: String(profession.name || "Métier"),
    type: profession.type || profession.category || "secondary",
    tiers: Array.isArray(profession.tiers)
      ? profession.tiers
      : [{
          name: "Progression actuelle",
          skillPoints: Number(profession.skillLevel || 0),
          maxSkillPoints: Number(profession.maxSkillLevel || 0),
        }],
  }));
}

function renderProfileProfessions(professions = [], message = "") {
  const container = document.getElementById("profileCharacterProfessions");
  if (!container) return;

  const normalized = normalizeProfileProfessions(professions);
  if (!normalized.length) {
    container.innerHTML = `<p class="profile-progress-empty">${escapeHtml(message || "Aucun métier enregistré pour ce personnage.")}</p>`;
    return;
  }

  container.innerHTML = normalized.map((profession) => {
    const tiers = profession.tiers.filter((tier) =>
      Number(tier.skillPoints || 0) > 0 || Number(tier.maxSkillPoints || 0) > 0,
    );
    const renderTier = (tier) => {
      const current = Number(tier.skillPoints || 0);
      const maximum = Number(tier.maxSkillPoints || 0);
      const progress = maximum > 0
        ? Math.min(100, Math.max(0, (current / maximum) * 100))
        : 0;
      return `<div class="profile-profession-tier">
        <div><span>${escapeHtml(tier.name || "Progression")}</span><strong>${current}/${maximum || "—"}</strong></div>
        <span class="profile-profession-track" aria-hidden="true"><i style="width:${progress.toFixed(1)}%"></i></span>
      </div>`;
    };
    const visibleTiers = tiers.slice(0, 2);
    const hiddenTiers = tiers.slice(2);

    return `<section class="profile-profession-entry">
      <header>
        <span class="profile-profession-name">
          <img src="${getProfessionIconUrl(profession.name)}" alt="" loading="lazy">
          <strong>${escapeHtml(profession.name)}</strong>
        </span>
        <small>${profession.type === "primary" ? "Principal" : "Secondaire"}</small>
      </header>
      ${visibleTiers.length
        ? visibleTiers.map(renderTier).join("")
        : '<p class="profile-progress-empty">Niveau non disponible</p>'}
      ${hiddenTiers.length ? `<details class="profile-profession-more">
        <summary>+${hiddenTiers.length} progression${hiddenTiers.length > 1 ? "s" : ""}</summary>
        ${hiddenTiers.map(renderTier).join("")}
      </details>` : ""}
    </section>`;
  }).join("");
}

function getCollectorAchievementSummary(character) {
  const achievements = (getProfileCollectorCharacter(character)?.achievements || [])
    .filter((achievement) => achievement?.completed === true)
    .sort((first, second) =>
      Number(second.completedAt || second.observedEarnedAt || 0) -
      Number(first.completedAt || first.observedEarnedAt || 0),
    );

  if (!achievements.length) return null;
  return {
    totalQuantity: achievements.length,
    totalPoints: achievements.reduce(
      (total, achievement) => total + Number(achievement.points || 0),
      0,
    ),
    recent: achievements.slice(0, 3).map((achievement) => ({
      name: achievement.name,
      completedAt: Number(achievement.completedAt || achievement.observedEarnedAt || 0),
    })),
  };
}

function renderProfileAchievements(summary, message = "") {
  const count = document.getElementById("profileAchievementCount");
  const points = document.getElementById("profileAchievementPoints");
  const recent = document.getElementById("profileAchievementRecent");
  if (!count || !points || !recent) return;

  count.textContent = summary ? formatProfileNumber(summary.totalQuantity) : "—";
  points.textContent = summary ? formatProfileNumber(summary.totalPoints) : "—";

  const achievements = summary?.recent || [];
  recent.innerHTML = achievements.length
    ? achievements.map((achievement) => {
        const completedAt = Number(achievement.completedAt || 0);
        const completedAtMs = completedAt > 0 && completedAt < 1e12
          ? completedAt * 1000
          : completedAt;
        const date = completedAt
          ? new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short", year: "numeric" })
              .format(new Date(completedAtMs))
          : "Date inconnue";
        return `<div class="profile-recent-achievement">
          <span aria-hidden="true">◆</span>
          <div><strong>${escapeHtml(achievement.name || "Haut fait obtenu")}</strong><small>${escapeHtml(date)}</small></div>
        </div>`;
      }).join("")
    : `<p class="profile-progress-empty">${escapeHtml(message || "Aucun haut fait attribué à ce personnage.")}</p>`;
}

function getCollectionQualityClass(quality) {
  const value = String(quality || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/legendaire|legendary/.test(value)) return "is-legendary";
  if (/epique|epic/.test(value)) return "is-epic";
  if (/rare/.test(value)) return "is-rare";
  if (/inhabituel|uncommon/.test(value)) return "is-uncommon";
  return "is-common";
}

function getProfileCollectionMediaUrl(kind, item) {
  const params = new URLSearchParams({ render: "transparent-v3" });
  if (kind === "pet" && item.displayId) {
    params.set("displayId", item.displayId);
  }
  return `/api/ase/collection-media/${kind}/${encodeURIComponent(item.id)}?${params}`;
}

function removeProfileCollectionImageBackground(image) {
  if (!image?.naturalWidth || image.dataset.backgroundProcessed === "true") return;
  image.dataset.backgroundProcessed = "true";
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;

  try {
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const samples = [];
    const stepX = Math.max(1, Math.floor(canvas.width / 24));
    const stepY = Math.max(1, Math.floor(canvas.height / 24));
    for (let x = 0; x < canvas.width; x += stepX) {
      samples.push((x * 4), ((canvas.height - 1) * canvas.width + x) * 4);
    }
    for (let y = 0; y < canvas.height; y += stepY) {
      samples.push((y * canvas.width) * 4, (y * canvas.width + canvas.width - 1) * 4);
    }

    const opaqueSamples = samples.filter((index) => pixels.data[index + 3] > 220);
    if (opaqueSamples.length < samples.length * .75) {
      image.classList.remove("is-processing");
      return;
    }
    const background = opaqueSamples.reduce((total, index) => {
      total[0] += pixels.data[index];
      total[1] += pixels.data[index + 1];
      total[2] += pixels.data[index + 2];
      return total;
    }, [0, 0, 0]).map((value) => value / opaqueSamples.length);
    const variation = Math.sqrt(opaqueSamples.reduce((total, index) => {
      return total + ((pixels.data[index] - background[0]) ** 2) +
        ((pixels.data[index + 1] - background[1]) ** 2) +
        ((pixels.data[index + 2] - background[2]) ** 2);
    }, 0) / opaqueSamples.length);
    const luminance = background[0] * .2126 + background[1] * .7152 + background[2] * .0722;
    if (variation > 24 || luminance > 95) {
      image.classList.remove("is-processing");
      return;
    }

    for (let index = 0; index < pixels.data.length; index += 4) {
      const distance = Math.sqrt(
        ((pixels.data[index] - background[0]) ** 2) +
        ((pixels.data[index + 1] - background[1]) ** 2) +
        ((pixels.data[index + 2] - background[2]) ** 2),
      );
      if (distance <= 18) {
        pixels.data[index + 3] = 0;
      } else if (distance < 52) {
        pixels.data[index + 3] = Math.round(
          pixels.data[index + 3] * ((distance - 18) / 34),
        );
      }
    }
    context.putImageData(pixels, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        image.classList.remove("is-processing");
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      image.addEventListener("load", () => {
        URL.revokeObjectURL(objectUrl);
        image.classList.remove("is-processing");
        image.classList.add("is-background-removed");
      }, { once: true });
      image.src = objectUrl;
    }, "image/png");
  } catch (_error) {
    image.classList.remove("is-processing");
  }
}

function prepareProfileCollectionImage(image) {
  if (!image) return;
  image.classList.add("is-processing");
  if (image.complete && image.naturalWidth) {
    removeProfileCollectionImageBackground(image);
  } else {
    image.addEventListener("load", () => removeProfileCollectionImageBackground(image), { once: true });
  }
}

function positionProfileCollectionTooltip(event) {
  const tooltip = document.getElementById("profileCollectionTooltip");
  if (!tooltip || tooltip.hidden) return;
  const anchor = event.currentTarget?.getBoundingClientRect?.();
  const pointerX = Number(event.clientX) || (anchor ? anchor.right : 0);
  const pointerY = Number(event.clientY) || (anchor ? anchor.top : 0);
  const gap = 14;
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  let left = pointerX + gap;
  let top = pointerY + gap;
  if (left + width > window.innerWidth - 10) left = pointerX - width - gap;
  if (top + height > window.innerHeight - 10) top = window.innerHeight - height - 10;
  tooltip.style.left = `${Math.max(10, left)}px`;
  tooltip.style.top = `${Math.max(10, top)}px`;
}

function getProfileCollectionTooltipMarkup(kind, item, detail = null) {
  const isMount = kind === "mount";
  const quality = !isMount && item.quality
    ? `<span class="profile-collection-quality ${getCollectionQualityClass(item.quality)}">${escapeHtml(item.quality)}</span>`
    : "";
  const stats = !isMount && (item.health || item.power || item.speed)
    ? `<div class="profile-tooltip-stats">
        <span>♥ ${formatProfileNumber(item.health)} Vie</span>
        <span>⚔ ${formatProfileNumber(item.power)} Puissance</span>
        <span>➤ ${formatProfileNumber(item.speed)} Vitesse</span>
      </div>`
    : "";
  const type = detail?.type || (isMount ? "Monture" : item.speciesName || "Mascotte de combat");
  const source = detail?.source ? `<p><strong>Source :</strong> ${escapeHtml(detail.source)}</p>` : "";
  const description = detail?.description
    ? `<p class="profile-tooltip-description">${escapeHtml(detail.description)}</p>`
    : "";

  return `<div class="profile-tooltip-title">
      <img src="${getProfileCollectionMediaUrl(kind, item)}" alt="">
      <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(type)}</small></div>
      ${item.favorite ? '<span title="Favorite">★</span>' : ""}
    </div>
    ${!isMount && item.level ? `<span class="profile-tooltip-level">Niveau <strong>${item.level}</strong></span>` : ""}
    ${quality}${stats}
    <p class="profile-tooltip-collected">Collecté${item.favorite ? " · Favori" : ""}</p>
    ${source}${description}
    <small class="profile-tooltip-id">Identifiant : ${item.id}</small>`;
}

function bindProfileCollectionTooltipImageFallback(tooltip) {
  const image = tooltip.querySelector("img");
  prepareProfileCollectionImage(image);
  image?.addEventListener("error", (event) => {
    event.currentTarget.hidden = true;
  }, { once: true });
}

async function loadProfileCollectionDetail(kind, item) {
  const key = `${kind}:${item.id}`;
  if (profileCollectionDetails.has(key)) return profileCollectionDetails.get(key);
  const response = await fetch(`/api/ase/collection-detail/${kind}/${encodeURIComponent(item.id)}`);
  if (!response.ok) return null;
  const detail = await response.json();
  profileCollectionDetails.set(key, detail);
  return detail;
}

async function showProfileCollectionTooltip(event, kind, item) {
  const tooltip = document.getElementById("profileCollectionTooltip");
  if (!tooltip) return;
  const key = `${kind}:${item.id}`;
  activeProfileCollectionTooltipKey = key;
  tooltip.innerHTML = getProfileCollectionTooltipMarkup(kind, item, profileCollectionDetails.get(key));
  bindProfileCollectionTooltipImageFallback(tooltip);
  tooltip.hidden = false;
  positionProfileCollectionTooltip(event);

  if (profileCollectionDetails.has(key)) return;
  try {
    const detail = await loadProfileCollectionDetail(kind, item);
    if (!detail) return;
    if (activeProfileCollectionTooltipKey !== key || tooltip.hidden) return;
    tooltip.innerHTML = getProfileCollectionTooltipMarkup(kind, item, detail);
    bindProfileCollectionTooltipImageFallback(tooltip);
    positionProfileCollectionTooltip(event);
  } catch (_error) {
    // Les informations déjà présentes restent affichées si Blizzard est indisponible.
  }
}

function hideProfileCollectionTooltip() {
  const tooltip = document.getElementById("profileCollectionTooltip");
  activeProfileCollectionTooltipKey = "";
  if (tooltip) tooltip.hidden = true;
}

function getProfileCollectionModalMarkup(kind, item, detail = null) {
  const isMount = kind === "mount";
  const type = detail?.type || (isMount ? "Monture" : item.speciesName || "Mascotte de combat");
  const stats = !isMount && (item.health || item.power || item.speed)
    ? `<div class="profile-modal-stats">
        <span><b>♥</b><strong>${formatProfileNumber(item.health)}</strong><small>Vie</small></span>
        <span><b>⚔</b><strong>${formatProfileNumber(item.power)}</strong><small>Puissance</small></span>
        <span><b>➤</b><strong>${formatProfileNumber(item.speed)}</strong><small>Vitesse</small></span>
      </div>`
    : "";
  const quality = !isMount && item.quality
    ? `<span class="profile-modal-quality ${getCollectionQualityClass(item.quality)}">${escapeHtml(item.quality)}</span>`
    : "";
  const source = detail?.source
    ? `<div class="profile-modal-data"><small>Source</small><strong>${escapeHtml(detail.source)}</strong></div>`
    : `<div class="profile-modal-data"><small>Source</small><strong>Information non fournie</strong></div>`;
  const description = detail?.description
    ? escapeHtml(detail.description)
    : "Les informations complémentaires seront affichées dès qu’elles seront disponibles auprès de Battle.net.";

  return `<header class="profile-modal-header">
      <img class="profile-modal-icon" src="${getProfileCollectionMediaUrl(kind, item)}" alt="">
      <div>
        <span>${escapeHtml(type)}</span>
        <h3 id="profileCollectionModalTitle">${escapeHtml(item.name)}</h3>
        <p>Collecté${item.favorite ? " · Dans vos favoris" : ""}</p>
      </div>
      ${item.favorite ? '<span class="profile-modal-favorite" title="Favori">★</span>' : ""}
    </header>
    <div class="profile-modal-information">
      ${source}
      ${!isMount && item.level ? `<div class="profile-modal-data"><small>Niveau</small><strong>${item.level}</strong></div>` : ""}
      ${quality}
      <p class="profile-modal-description">${description}</p>
      ${stats}
    </div>
    <div class="profile-modal-showcase">
      <span class="profile-modal-ornament profile-modal-ornament-left" aria-hidden="true"></span>
      <img src="${getProfileCollectionMediaUrl(kind, item)}" alt="${escapeHtml(item.name)}">
      <span class="profile-modal-ornament profile-modal-ornament-right" aria-hidden="true"></span>
      <small>${isMount ? "Monture de la collection" : "Mascotte de combat"} · #${item.id}</small>
    </div>`;
}

function bindProfileCollectionModalImages(modal) {
  modal.querySelectorAll("img").forEach((image) => {
    prepareProfileCollectionImage(image);
    image.addEventListener("error", () => {
      image.hidden = true;
      image.parentElement?.classList.add("is-image-missing");
    }, { once: true });
  });
}

async function openProfileCollectionModal(trigger, kind, item) {
  const modal = document.getElementById("profileCollectionModal");
  const body = document.getElementById("profileCollectionModalBody");
  if (!modal || !body) return;
  hideProfileCollectionTooltip();
  profileCollectionModalTrigger = trigger;
  const key = `${kind}:${item.id}`;
  activeProfileCollectionModalKey = key;
  body.innerHTML = getProfileCollectionModalMarkup(kind, item, profileCollectionDetails.get(key));
  bindProfileCollectionModalImages(body);
  modal.hidden = false;
  document.body.classList.add("is-collection-modal-open");
  document.getElementById("profileCollectionModalClose")?.focus({ preventScroll: true });

  try {
    const detail = await loadProfileCollectionDetail(kind, item);
    if (!detail || modal.hidden || activeProfileCollectionModalKey !== key) return;
    body.innerHTML = getProfileCollectionModalMarkup(kind, item, detail);
    bindProfileCollectionModalImages(body);
  } catch (_error) {
    // La fiche locale reste utilisable si les détails Blizzard ne répondent pas.
  }
}

function closeProfileCollectionModal() {
  const modal = document.getElementById("profileCollectionModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  activeProfileCollectionModalKey = "";
  document.body.classList.remove("is-collection-modal-open");
  profileCollectionModalTrigger?.focus({ preventScroll: true });
  profileCollectionModalTrigger = null;
}

function getProfilePaginationPages(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages].filter((page) => page > 0 && page <= totalPages).sort((a, b) => a - b);
}

function renderProfileCollectionPagination(totalItems) {
  const pagination = document.getElementById("profileCollectionPagination");
  if (!pagination) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / PROFILE_COLLECTION_PAGE_SIZE));
  profileCollectionPage = Math.min(totalPages, Math.max(1, profileCollectionPage));
  if (totalItems <= PROFILE_COLLECTION_PAGE_SIZE) {
    pagination.hidden = true;
    pagination.innerHTML = "";
    return;
  }
  const pages = getProfilePaginationPages(profileCollectionPage, totalPages);
  let previousPage = 0;
  const pageButtons = pages.map((page) => {
    const separator = previousPage && page - previousPage > 1
      ? '<span class="profile-pagination-gap" aria-hidden="true">…</span>'
      : "";
    previousPage = page;
    return `${separator}<button type="button" data-profile-collection-page="${page}" class="${page === profileCollectionPage ? "is-active" : ""}" ${page === profileCollectionPage ? 'aria-current="page"' : ""}>${page}</button>`;
  }).join("");
  pagination.hidden = false;
  pagination.innerHTML = `<div class="profile-pagination-heading">
      <span>Navigation</span>
      <strong>Page ${profileCollectionPage} <i>/</i> ${totalPages}</strong>
      <small>${formatProfileNumber(totalItems)} objets dans la collection</small>
    </div>
    <div class="profile-pagination-controls">
      <button class="profile-pagination-arrow" type="button" data-profile-collection-page="${profileCollectionPage - 1}" aria-label="Page précédente" ${profileCollectionPage === 1 ? "disabled" : ""}><span>‹</span></button>
      <div class="profile-pagination-pages">${pageButtons}</div>
      <button class="profile-pagination-arrow" type="button" data-profile-collection-page="${profileCollectionPage + 1}" aria-label="Page suivante" ${profileCollectionPage === totalPages ? "disabled" : ""}><span>›</span></button>
    </div>`;
}

function renderProfileCollectionList() {
  const list = document.getElementById("profileCollectionList");
  const pagination = document.getElementById("profileCollectionPagination");
  if (!list || !pagination) return;

  const collection = profileCollectionData?.[activeProfileCollectionTab];
  const items = Array.isArray(collection?.items) ? collection.items : [];
  document.querySelectorAll("[data-profile-collection-tab]").forEach((button) => {
    const selected = button.dataset.profileCollectionTab === activeProfileCollectionTab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });

  if (!collection?.available || !items.length) {
    const label = activeProfileCollectionTab === "mounts" ? "monture" : "mascotte";
    list.innerHTML = `<p class="profile-progress-empty">${collection?.available ? `Aucune ${label} trouvée.` : "Cette collection est indisponible."}</p>`;
    pagination.hidden = true;
    hideProfileCollectionTooltip();
    return;
  }

  const kind = activeProfileCollectionTab === "mounts" ? "mount" : "pet";
  const start = (profileCollectionPage - 1) * PROFILE_COLLECTION_PAGE_SIZE;
  const visibleItems = items.slice(start, start + PROFILE_COLLECTION_PAGE_SIZE);
  list.innerHTML = visibleItems.map((item) => `<button
      class="profile-collection-tile ${item.favorite ? "is-favorite" : ""}"
      type="button"
      aria-label="${escapeHtml(item.name)}"
      data-profile-collection-index="${items.indexOf(item)}"
    >
      <span class="profile-collection-thumb">
        <img src="${getProfileCollectionMediaUrl(kind, item)}" alt="" loading="lazy">
        <span aria-hidden="true">${kind === "mount" ? "♞" : "✦"}</span>
      </span>
      ${item.favorite ? '<span class="profile-tile-favorite" aria-hidden="true">★</span>' : ""}
      ${kind === "pet" && item.level ? `<span class="profile-tile-level">${item.level}</span>` : ""}
    </button>`).join("");

  list.querySelectorAll(".profile-collection-tile").forEach((tile) => {
    const item = items[Number(tile.dataset.profileCollectionIndex)];
    tile.addEventListener("mouseenter", (event) => showProfileCollectionTooltip(event, kind, item));
    tile.addEventListener("mousemove", positionProfileCollectionTooltip);
    tile.addEventListener("mouseleave", hideProfileCollectionTooltip);
    tile.addEventListener("focus", (event) => showProfileCollectionTooltip(event, kind, item));
    tile.addEventListener("blur", hideProfileCollectionTooltip);
    tile.addEventListener("click", () => openProfileCollectionModal(tile, kind, item));
    const image = tile.querySelector("img");
    prepareProfileCollectionImage(image);
    image?.addEventListener("error", (event) => {
      event.currentTarget.hidden = true;
      event.currentTarget.parentElement?.classList.add("is-fallback");
    }, { once: true });
  });
  renderProfileCollectionPagination(items.length);
}

function renderProfileCollections(collections, message = "") {
  const mountCount = document.getElementById("profileMountCount");
  const petCount = document.getElementById("profilePetCount");
  const status = document.getElementById("profileCollectionStatus");
  if (!mountCount || !petCount || !status) return;

  profileCollectionData = collections;
  activeProfileCollectionTab = "mounts";
  profileCollectionPage = 1;

  mountCount.textContent = collections?.mounts?.available
    ? formatProfileNumber(collections.mounts.count)
    : "—";
  petCount.textContent = collections?.pets?.available
    ? formatProfileNumber(collections.pets.uniqueSpecies || collections.pets.count)
    : "—";

  const details = [];
  if (collections?.mounts?.available && collections.mounts.favorites > 0) {
    details.push(`${formatProfileNumber(collections.mounts.favorites)} favorites`);
  }
  if (collections?.pets?.available && collections.pets.maxLevel > 0) {
    details.push(`${formatProfileNumber(collections.pets.maxLevel)} mascottes niveau 25`);
  }
  status.textContent = details.join(" · ") || message ||
    (collections ? "Collections Battle.net synchronisées" : "Collections indisponibles");
  renderProfileCollectionList();
}

async function loadCharacterProgression(character) {
  const requestedCharacterKey = getCharacterKey(character);
  const collectorCharacter = getProfileCollectorCharacter(character);
  const collectorProfessions = collectorCharacter?.professions || [];
  const collectorAchievements = getCollectorAchievementSummary(character);

  renderProfileProfessions(
    collectorProfessions,
    character.isShowcase ? "Aucune donnée pour le personnage de démonstration." : "Chargement des métiers...",
  );
  renderProfileAchievements(
    collectorAchievements,
    character.isShowcase ? "Aucune donnée pour le personnage de démonstration." : "Chargement des hauts faits...",
  );
  renderProfileCollections(
    null,
    character.isShowcase ? "Aucune donnée pour le personnage de démonstration." : "Chargement des collections...",
  );

  if (character.isShowcase) return;

  try {
    const realm = encodeURIComponent(character.realm);
    const name = encodeURIComponent(character.name);
    const response = await fetch(
      `/api/characters/${realm}/${name}/progression`,
      { headers: { Accept: "application/json" } },
    );

    if (!profiledCharacter || getCharacterKey(profiledCharacter) !== requestedCharacterKey) return;

    if (response.status === 401) {
      if (!collectorProfessions.length) {
        renderProfileProfessions([], "Reconnecte Battle.net pour actualiser les métiers.");
      }
      if (!collectorAchievements) {
        renderProfileAchievements(null, "Lance /azer scan pour importer les hauts faits.");
      }
      renderProfileCollections(null, "Reconnecte Battle.net pour charger les collections.");
      return;
    }
    if (!response.ok) throw new Error("Progression indisponible.");

    const data = await response.json();
    if (data.available?.professions) {
      renderProfileProfessions(data.professions || []);
    } else if (!collectorProfessions.length) {
      renderProfileProfessions([], "Les métiers sont indisponibles.");
    }
    renderProfileAchievements(
      data.achievements || collectorAchievements,
      "Aucun haut fait terminé trouvé.",
    );
    renderProfileCollections(
      data.collections,
      data.available?.collections
        ? "Collections Battle.net synchronisées"
        : "Collections temporairement indisponibles.",
    );
  } catch (error) {
    console.warn(error.message || error);
    if (!profiledCharacter || getCharacterKey(profiledCharacter) !== requestedCharacterKey) return;
    if (!collectorProfessions.length) renderProfileProfessions([], "Les métiers sont indisponibles.");
    if (!collectorAchievements) renderProfileAchievements(null, "Les hauts faits sont indisponibles.");
    renderProfileCollections(null, "Les collections sont indisponibles.");
  }
}

function renderCharacterProfileImage(character, requestedMode = "full-body") {
  const profileImage = document.getElementById("profileCharacterImage");
  const portraitContainer = document.querySelector(
    ".character-profile-portrait",
  );
  const fullBodyImage = getCharacterFullBodyImage(character);
  const portraitImage = getCharacterPortraitImage(character);
  const canShowFullBody = Boolean(fullBodyImage);

  profileImageMode =
    requestedMode === "full-body" && canShowFullBody ? "full-body" : "portrait";

  // Les deux modes utilisent maintenant deux médias Blizzard distincts :
  // - plein corps : main/main-raw
  // - portrait    : inset/bust/portrait (avatar seulement en dernier recours)
  const usesFullBodyForPortrait = false;

  if (profileImage) {
    profileImage.src =
      profileImageMode === "full-body"
        ? fullBodyImage
        : portraitImage;
    profileImage.alt =
      profileImageMode === "full-body"
        ? `Vue en pied de ${character.name}`
        : `Portrait de ${character.name}`;
    profileImage.draggable = false;
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

  applyProfileImageView();
}



const HERO_EQUIPMENT_SLOT_LAYOUT = {
  left: ["head", "neck", "shoulder", "back", "chest", "shirt", "tabard", "wrist"],
  right: ["hands", "waist", "legs", "feet", "finger1", "finger2", "trinket1", "trinket2"],
  weapons: ["mainHand", "offHand"],
};

const HERO_EQUIPMENT_SLOT_LABELS = {
  head: "Tête", neck: "Cou", shoulder: "Épaules", back: "Dos",
  chest: "Torse", shirt: "Chemise", tabard: "Tabard", wrist: "Poignets",
  hands: "Mains", waist: "Taille", legs: "Jambes", feet: "Pieds",
  finger1: "Anneau 1", finger2: "Anneau 2", trinket1: "Bijou 1", trinket2: "Bijou 2",
  mainHand: "Main droite", offHand: "Main gauche",
};

const HERO_EQUIPMENT_SLOT_GLYPHS = {
  head: "♕", neck: "◇", shoulder: "◢", back: "⌁", chest: "♜", shirt: "▱",
  tabard: "⚑", wrist: "▰", hands: "✦", waist: "═", legs: "Ⅱ", feet: "⌄",
  finger1: "○", finger2: "○", trinket1: "✧", trinket2: "✧", mainHand: "⚔", offHand: "🛡",
};

const HERO_ITEM_QUALITY_CLASS = {
  0: "poor", 1: "common", 2: "uncommon", 3: "rare", 4: "epic", 5: "legendary",
};

function getHeroEquipmentKey(character) {
  return `${String(character.realm || "").toLowerCase()}::${String(character.name || "").toLowerCase()}`;
}

function getHeroEquipmentIconUrl(item) {
  const direct = item?.iconUrl || item?.textureUrl;
  if (typeof direct === "string" && /^(https?:|\/)/i.test(direct)) return direct;
  const itemId = Number(item?.itemId || 0);
  return itemId ? `/api/ase/item-icon/${itemId}` : "";
}

function cleanWowTooltipText(value) {
  return String(value || "")
    .replace(/\|c[0-9a-fA-F]{8}/g, "")
    .replace(/\|r/g, "")
    .replace(/\|T[^|]+\|t/g, "")
    .trim();
}

function formatHeroEquipmentTooltip(slotName, item) {
  if (!item?.equipped) {
    return `<span>${escapeHtml(HERO_EQUIPMENT_SLOT_LABELS[slotName] || slotName)}</span><strong>Emplacement vide</strong>`;
  }

  const qualityClass = HERO_ITEM_QUALITY_CLASS[item?.quality] || "common";
  const nativeLines = Array.isArray(item.tooltipLines)
    ? item.tooltipLines
        .map((line) => ({
          left: cleanWowTooltipText(line?.leftText),
          right: cleanWowTooltipText(line?.rightText),
          leftColor: line?.leftColor || null,
          rightColor: line?.rightColor || null,
        }))
        .filter((line) => line.left || line.right)
    : [];

  const colorStyle = (color) => {
    if (!color || typeof color !== "object") return "";
    const r = Number(color.r), g = Number(color.g), b = Number(color.b);
    if (![r,g,b].every(Number.isFinite)) return "";
    const rr = Math.round(Math.max(0, Math.min(1, r)) * 255);
    const gg = Math.round(Math.max(0, Math.min(1, g)) * 255);
    const bb = Math.round(Math.max(0, Math.min(1, b)) * 255);
    return ` style="color:rgb(${rr},${gg},${bb})"`;
  };

  const statNames = {
    ITEM_MOD_STAMINA_SHORT: "Stamina",
    ITEM_MOD_STRENGTH_SHORT: "Strength",
    ITEM_MOD_AGILITY_SHORT: "Agility",
    ITEM_MOD_INTELLECT_SHORT: "Intellect",
    ITEM_MOD_AGILITY_INTELLECT_SHORT: "[Agility or Intellect]",
    ITEM_MOD_AGILITY_STRENGTH_INTELLECT_SHORT: "[Agility, Strength or Intellect]",
    ITEM_MOD_CRIT_RATING_SHORT: "Critical Strike",
    ITEM_MOD_HASTE_RATING_SHORT: "Haste",
    ITEM_MOD_MASTERY_RATING_SHORT: "Mastery",
    ITEM_MOD_VERSATILITY: "Versatility",
    ITEM_MOD_VERSATILITY_SHORT: "Versatility",
    ITEM_MOD_LIFESTEAL_SHORT: "Leech",
    ITEM_MOD_CR_LIFESTEAL_SHORT: "Leech",
    ITEM_MOD_AVOIDANCE_SHORT: "Avoidance",
    ITEM_MOD_CR_AVOIDANCE_SHORT: "Avoidance",
    ITEM_MOD_SPEED_SHORT: "Speed",
    ITEM_MOD_CR_SPEED_SHORT: "Speed",
    ITEM_MOD_BLOCK_RATING_SHORT: "Block",
    ITEM_MOD_DODGE_RATING_SHORT: "Dodge",
    ITEM_MOD_PARRY_RATING_SHORT: "Parry",
    ITEM_MOD_ARMOR_SHORT: "Armor",
  };
  const secondaryStats = new Set([
    "ITEM_MOD_CRIT_RATING_SHORT", "ITEM_MOD_HASTE_RATING_SHORT",
    "ITEM_MOD_MASTERY_RATING_SHORT", "ITEM_MOD_VERSATILITY",
    "ITEM_MOD_VERSATILITY_SHORT", "ITEM_MOD_LIFESTEAL_SHORT",
    "ITEM_MOD_CR_LIFESTEAL_SHORT", "ITEM_MOD_AVOIDANCE_SHORT",
    "ITEM_MOD_CR_AVOIDANCE_SHORT", "ITEM_MOD_SPEED_SHORT",
    "ITEM_MOD_CR_SPEED_SHORT",
  ]);
  const bindLabels = { 1: "Binds when picked up", 2: "Binds when equipped", 3: "Binds when used", 4: "Quest Item" };
  const stats = Object.entries(item.stats || {});
  const armor = stats.find(([key]) => key === "ITEM_MOD_ARMOR_SHORT");
  const primary = stats.filter(([key]) => key !== "ITEM_MOD_ARMOR_SHORT" && !secondaryStats.has(key));
  const secondary = stats.filter(([key]) => secondaryStats.has(key));
  const sell = Number(item.sellPrice || 0);
  const gold = Math.floor(sell / 10000);
  const silver = Math.floor((sell % 10000) / 100);
  const copper = sell % 100;
  const sellParts = [];
  if (gold) sellParts.push(`${gold}g`);
  if (silver) sellParts.push(`${silver}s`);
  if (copper || !sellParts.length) sellParts.push(`${copper}c`);

  const slotLabel = HERO_EQUIPMENT_SLOT_LABELS[slotName] || slotName;
  const typeLabel = item.itemSubType || item.itemType || "";
  const sourceName = cleanWowTooltipText(item.sourceName || item.droppedBy || "");
  const dropChance = Number(item.dropChance || 0);

  const formatStatName = (key) => {
    if (statNames[key]) return statNames[key];
    return String(key || "Stat")
      .replace(/^ITEM_MOD_/, "")
      .replace(/_(SHORT|RATING)$/g, "")
      .toLowerCase()
      .replace(/(^|_)\w/g, (match) => match.replace("_", " ").toUpperCase());
  };

  const row = (left, right = "", css = "") => !left && !right ? "" : `
    <div class="wow-tooltip-line${css ? ` ${css}` : ""}"><span>${escapeHtml(left)}</span>${right ? `<span class="wow-tooltip-line-right">${escapeHtml(right)}</span>` : ""}</div>`;

  const nativeRow = (line) => `
    <div class="wow-tooltip-line"${colorStyle(line.leftColor)}>
      <span>${escapeHtml(line.left)}</span>
      ${line.right ? `<span class="wow-tooltip-line-right"${colorStyle(line.rightColor)}>${escapeHtml(line.right)}</span>` : ""}
    </div>`;

  const compact = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s,.\u00a0]/g, "");
  const statValues = stats.map(([, value]) => Number(value)).filter(Number.isFinite);
  const itemLevel = Number(item.itemLevel || 0);
  const durabilityCurrent = Number(item.durabilityCurrent || 0);
  const durabilityMax = Number(item.durabilityMax || 0);
  const minLevel = Number(item.minLevel || 0);
  const slotKey = compact(slotLabel);
  const typeKey = compact(typeLabel);

  // Les lignes natives contiennent aussi les effets, châsses et améliorations
  // que GetItemStats ne connaît pas. On conserve ces lignes, mais on retire les
  // doublons des champs structurés que l'on place dans l'ordre Wowhead.
  const supplementalNativeLines = nativeLines.slice(1).filter((line) => {
    const left = compact(line.left);
    const right = compact(line.right);
    const combined = `${left}${right}`;
    if (!combined) return false;
    if ((left.includes("itemlevel") || left.includes("niveaudobjet")) && (!itemLevel || left.includes(String(itemLevel)))) return false;
    if (/bindswhen|liequand|lieal|objetdequete|questitem/.test(left)) return false;
    if (left === slotKey && (!typeKey || right === typeKey)) return false;
    if (/durability|durabilite/.test(left)) return false;
    if (/requireslevel|niveaurequis/.test(left)) return false;
    if (/sellprice|prixdevente/.test(left)) return false;
    if (statValues.some((value) => combined.includes(`+${value}`))) return false;
    return true;
  });

  const titleLine = nativeLines[0];
  const title = titleLine?.left || item.itemName || "Objet équipé";
  const footerRows = [
    durabilityCurrent > 0
      ? row(`Durability ${durabilityCurrent} / ${durabilityMax || durabilityCurrent}`)
      : "",
    minLevel > 0 ? row(`Requires Level ${minLevel}`) : "",
    sell > 0 ? row(`Sell Price: ${sellParts.join(" ")}`) : "",
  ].filter(Boolean);

  return `
    <strong class="quality-${qualityClass}"${colorStyle(titleLine?.leftColor)}>${escapeHtml(title)}</strong>
    ${itemLevel > 0 ? row(`Item Level ${itemLevel}`, "", "is-item-level") : ""}
    ${bindLabels[Number(item.bindType || 0)] ? row(bindLabels[Number(item.bindType || 0)]) : ""}
    ${row(slotLabel, typeLabel)}
    ${armor ? row(`${Number(armor[1]) || armor[1]} Armor`) : ""}
    ${primary.map(([key,value]) => row(`+${Number(value) || value} ${formatStatName(key)}`)).join("")}
    ${secondary.map(([key,value]) => row(`+${Number(value) || value} ${formatStatName(key)}`, "", "is-stat-secondary")).join("")}
    ${supplementalNativeLines.map(nativeRow).join("")}
    ${footerRows.length ? '<div class="wow-tooltip-spacer"></div>' : ""}
    ${footerRows.join("")}
    ${sourceName ? `<div class="wow-tooltip-spacer"></div>${row(`Dropped by: ${sourceName}`, "", "is-source")}` : ""}
    ${dropChance > 0 ? row(`Drop Chance: ${dropChance.toFixed(2)}%`, "", "is-source") : ""}
  `;
}

function positionHeroEquipmentTooltip(event) {
  const tooltip = document.getElementById("heroEquipmentTooltip");
  if (!tooltip || tooltip.hidden) return;
  const margin = 16;
  const rect = tooltip.getBoundingClientRect();
  const targetRect = event.currentTarget?.getBoundingClientRect?.();
  const hasPointerPosition = Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
    && (event.clientX !== 0 || event.clientY !== 0);
  const anchorX = hasPointerPosition ? event.clientX : (targetRect?.right || margin);
  const anchorY = hasPointerPosition ? event.clientY : (targetRect?.top || margin);
  let left = anchorX + 18;
  let top = anchorY + 18;
  if (left + rect.width > window.innerWidth - margin) left = anchorX - rect.width - 18;
  if (top + rect.height > window.innerHeight - margin) top = anchorY - rect.height - 18;
  tooltip.style.left = `${Math.max(margin, left)}px`;
  tooltip.style.top = `${Math.max(margin, top)}px`;
}

function showHeroEquipmentTooltip(event, slotName, item) {
  const tooltip = document.getElementById("heroEquipmentTooltip");
  if (!tooltip) return;
  tooltip.innerHTML = formatHeroEquipmentTooltip(slotName, item);
  tooltip.hidden = false;
  positionHeroEquipmentTooltip(event);
}

function hideHeroEquipmentTooltip() {
  const tooltip = document.getElementById("heroEquipmentTooltip");
  if (tooltip) tooltip.hidden = true;
}

function createHeroEquipmentSlot(slotName, item) {
  const equipped = Boolean(item?.equipped && item?.itemId);
  const qualityClass = HERO_ITEM_QUALITY_CLASS[item?.quality] || "common";
  const button = document.createElement("button");
  button.type = "button";
  button.className = `hero-equipment-slot is-${equipped ? "equipped" : "empty"} quality-${qualityClass}`;
  button.dataset.slotName = slotName;
  button.setAttribute("aria-describedby", "heroEquipmentTooltip");
  button.setAttribute("aria-label", equipped ? `${HERO_EQUIPMENT_SLOT_LABELS[slotName]} : ${item.itemName}` : `${HERO_EQUIPMENT_SLOT_LABELS[slotName]} vide`);

  const icon = document.createElement("span");
  icon.className = "hero-equipment-slot-icon";
  const iconUrl = equipped ? getHeroEquipmentIconUrl(item) : "";
  if (iconUrl) {
    const image = document.createElement("img");
    image.src = iconUrl;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.remove();
      icon.textContent = HERO_EQUIPMENT_SLOT_GLYPHS[slotName] || "◇";
    }, { once: true });
    icon.appendChild(image);
  } else {
    icon.textContent = HERO_EQUIPMENT_SLOT_GLYPHS[slotName] || "◇";
  }

  const label = document.createElement("span");
  label.className = "hero-equipment-slot-label";
  label.textContent = HERO_EQUIPMENT_SLOT_LABELS[slotName] || slotName;

  button.append(icon, label);
  // Le descriptif de l'objet est volontairement affiche uniquement au survol.
  button.addEventListener("mouseenter", (event) => showHeroEquipmentTooltip(event, slotName, item));
  button.addEventListener("mousemove", positionHeroEquipmentTooltip);
  button.addEventListener("mouseleave", hideHeroEquipmentTooltip);
  button.addEventListener("focus", (event) => showHeroEquipmentTooltip(event, slotName, item));
  button.addEventListener("blur", hideHeroEquipmentTooltip);
  return button;
}

function renderHeroEquipment(hero) {
  const equipment = hero?.equipment || {};
  const slots = equipment.slots || {};
  const left = document.getElementById("heroEquipmentLeft");
  const right = document.getElementById("heroEquipmentRight");
  const weapons = document.getElementById("heroEquipmentWeapons");
  const count = document.getElementById("heroEquipmentCount");
  const itemLevel = document.getElementById("heroEquipmentItemLevel");
  const status = document.getElementById("heroEquipmentStatus");
  const heroName = document.getElementById("heroEquipmentCharacterName");
  if (!left || !right || !weapons) return;

  left.innerHTML = "";
  right.innerHTML = "";
  weapons.innerHTML = "";
  HERO_EQUIPMENT_SLOT_LAYOUT.left.forEach((slotName) => left.appendChild(createHeroEquipmentSlot(slotName, slots[slotName])));
  HERO_EQUIPMENT_SLOT_LAYOUT.right.forEach((slotName) => right.appendChild(createHeroEquipmentSlot(slotName, slots[slotName])));
  HERO_EQUIPMENT_SLOT_LAYOUT.weapons.forEach((slotName) => weapons.appendChild(createHeroEquipmentSlot(slotName, slots[slotName])));

  const equippedCount = Number(equipment.equippedCount || 0);
  if (count) count.textContent = `${equippedCount} pièce${equippedCount > 1 ? "s" : ""} équipée${equippedCount > 1 ? "s" : ""}`;
  if (itemLevel) itemLevel.textContent = Number(equipment.calculatedItemLevel || equipment.equippedItemLevel || 0).toFixed(1);
  if (status) status.textContent = equippedCount ? "Équipement synchronisé par le Collector" : "Aucun équipement capturé";
  if (heroName) heroName.textContent = hero?.identity?.name || "Héros";
}

async function loadHeroEquipment(character) {
  const status = document.getElementById("heroEquipmentStatus");
  const key = getHeroEquipmentKey(character);
  if (status) status.textContent = "Chargement de l’équipement...";
  try {
    const response = await fetch(`/api/ase/heroes?characterKey=${encodeURIComponent(key)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Hero API ${response.status}`);
    const payload = await response.json();
    if (!profiledCharacter || getHeroEquipmentKey(profiledCharacter) !== key) return;
    const hero = Array.isArray(payload.heroes) ? payload.heroes[0] : null;
    if (!hero) throw new Error("Fiche Hero introuvable");
    renderHeroEquipment(hero);
  } catch (error) {
    console.warn("Hero Equipment:", error);
    if (status) status.textContent = "Équipement indisponible. Lance /azer scan puis synchronise.";
  }
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
  const profileLevelIcon = document.getElementById("profileCharacterLevelIcon");
  const profileClassFactIcon = document.getElementById("profileCharacterClassFactIcon");
  const profileRaceIcon = document.getElementById("profileCharacterRaceIcon");
  const profileFactionFactIcon = document.getElementById("profileCharacterFactionFactIcon");
  const profileRealmIcon = document.getElementById("profileCharacterRealmIcon");
  const profileLocationIcon = document.getElementById("profileCharacterLocationIcon");
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

  renderCharacterProfileImage(character, "full-body");
  loadHeroEquipment(character);

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
  if (profileLevelIcon) {
    profileLevelIcon.innerHTML = `<img class="profile-wow-icon-image" src="${getWowLevelIconUrl(character.level)}" alt="" aria-hidden="true">`;
    profileLevelIcon.title = `Niveau ${character.level}`;
  }

  if (profileClassFactIcon) {
    profileClassFactIcon.innerHTML = `<img class="profile-wow-icon-image" src="${getWowClassIconUrl(character.classIcon)}" alt="" aria-hidden="true">`;
  }

  if (profileRaceIcon) {
    profileRaceIcon.innerHTML = `<img class="profile-wow-icon-image" src="${getWowRaceIconUrl(character.raceName)}" alt="" aria-hidden="true">`;
    profileRaceIcon.title = character.raceName || "Race";
  }

  if (profileFactionFactIcon) {
    profileFactionFactIcon.innerHTML = getFactionIconMarkup(character.factionName);
  }

  if (profileRealmIcon) {
    profileRealmIcon.innerHTML = `<img class="profile-wow-icon-image" src="${getWowRealmIconUrl(character.realm)}" alt="" aria-hidden="true">`;
  }

  if (profileLocationIcon) {
    profileLocationIcon.innerHTML = `<img class="profile-wow-icon-image" src="${getWowIconUrl("inv_misc_map_01")}" alt="" aria-hidden="true">`;
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
  loadCharacterProgression(character);
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

document.querySelectorAll("[data-profile-collection-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.profileCollectionTab;
    if (!['mounts', 'pets'].includes(tab)) return;
    activeProfileCollectionTab = tab;
    profileCollectionPage = 1;
    hideProfileCollectionTooltip();
    renderProfileCollectionList();
  });
});

document.getElementById("profileCollectionPagination")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-collection-page]");
  if (!button || button.disabled) return;
  profileCollectionPage = Number(button.dataset.profileCollectionPage || 1);
  hideProfileCollectionTooltip();
  renderProfileCollectionList();
  document.getElementById("profileCollectionList")?.focus({ preventScroll: true });
});

document.getElementById("profileCollectionModalClose")?.addEventListener("click", closeProfileCollectionModal);
document.querySelector(".profile-collection-modal-backdrop")?.addEventListener("click", closeProfileCollectionModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProfileCollectionModal();
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


document.querySelectorAll("[data-profile-zoom]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!profiledCharacter) return;

    const action = button.dataset.profileZoom;
    if (action === "reset") {
      resetProfileImageView();
      return;
    }

    const current = getProfileImageView(profiledCharacter, profileImageMode);
    const step = action === "in" ? 0.18 : -0.18;
    updateProfileImageView({ zoom: current.zoom + step });
  });
});

const profileImageWindow = document.querySelector(".character-profile-image-window");

profileImageWindow?.addEventListener("wheel", (event) => {
  if (!profiledCharacter) return;
  event.preventDefault();

  const current = getProfileImageView(profiledCharacter, profileImageMode);
  const step = event.deltaY < 0 ? 0.14 : -0.14;
  updateProfileImageView({ zoom: current.zoom + step });
}, { passive: false });

profileImageWindow?.addEventListener("dblclick", (event) => {
  event.preventDefault();
  resetProfileImageView();
});

profileImageWindow?.addEventListener("pointerdown", (event) => {
  if (!profiledCharacter || event.button !== 0) return;

  const current = getProfileImageView(profiledCharacter, profileImageMode);
  profileImageDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    imageX: current.x,
    imageY: current.y,
  };

  profileImageWindow.setPointerCapture?.(event.pointerId);
  profileImageWindow.classList.add("is-dragging");
});

profileImageWindow?.addEventListener("pointermove", (event) => {
  if (!profileImageDragState || profileImageDragState.pointerId !== event.pointerId) return;

  const bounds = profileImageWindow.getBoundingClientRect();
  const dx = ((event.clientX - profileImageDragState.startX) / Math.max(bounds.width, 1)) * 100;
  const dy = ((event.clientY - profileImageDragState.startY) / Math.max(bounds.height, 1)) * 100;

  updateProfileImageView({
    x: profileImageDragState.imageX + dx,
    y: profileImageDragState.imageY + dy,
  });
});

function finishProfileImageDrag(event) {
  if (!profileImageDragState || profileImageDragState.pointerId !== event.pointerId) return;
  profileImageWindow?.releasePointerCapture?.(event.pointerId);
  profileImageWindow?.classList.remove("is-dragging");
  profileImageDragState = null;
}

profileImageWindow?.addEventListener("pointerup", finishProfileImageDrag);
profileImageWindow?.addEventListener("pointercancel", finishProfileImageDrag);

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
  worldCatalog: null,
  worldCatalogPromise: null,
  questCatalog: null,
  questCatalogPromise: null,
  selectedContinent: "",
  selectedRegion: "",
  statusFilter: "all",
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

function getQuestCharacterVisual(character) {
  const roster = typeof readCachedCharacterRoster === "function" ? readCachedCharacterRoster() : [];
  const name = normalizeCollectorIdentity(character?.name);
  const realm = normalizeCollectorIdentity(character?.realm);
  const match = roster.find((entry) =>
    normalizeCollectorIdentity(entry?.name) === name
      && normalizeCollectorIdentity(entry?.realm) === realm,
  ) || roster.find((entry) => normalizeCollectorIdentity(entry?.name) === name);

  if (!match) return { image: "", className: "", classColor: "" };
  let image = "";
  try {
    image = typeof getCharacterPortraitImage === "function" ? getCharacterPortraitImage(match) : "";
  } catch (_error) {
    image = match.portraitUrl || match.avatarUrl || "";
  }
  return {
    image,
    className: match.className || match.characterClassName || match.playableClass?.name || "",
    classColor: match.classColor || "",
  };
}

function renderQuestCharacterPicker(characters = []) {
  const picker = document.getElementById("questsCharacterPicker");
  const button = document.getElementById("questsCharacterButton");
  const menu = document.getElementById("questsCharacterMenu");
  const avatar = document.getElementById("questsCharacterAvatar");
  const name = document.getElementById("questsCharacterName");
  const realm = document.getElementById("questsCharacterRealm");
  if (!picker || !button || !menu || !name || !realm) return;

  const entries = [...characters];
  if (questsState.payload?.account) {
    entries.push({ identityKey: "__account__", name: "Bande de guerre", realm: "Compte", isAccountPicker: true });
  }

  const selected = entries.find((entry) =>
    (entry.isAccountPicker ? "__account__" : questCharacterKey(entry)) === questsState.selectedKey,
  ) || entries[0];

  const selectedVisual = selected?.isAccountPicker ? { image: "", className: "Compte", classColor: "" } : getQuestCharacterVisual(selected);
  name.textContent = selected?.name || "Personnage";
  realm.textContent = selected?.isAccountPicker
    ? "Progression partagée"
    : [selectedVisual.className, selected?.realm].filter(Boolean).join(" · ") || selected?.realm || "Royaume";

  if (avatar) {
    if (selectedVisual.image) {
      avatar.src = selectedVisual.image;
      avatar.alt = `Portrait de ${selected?.name || "personnage"}`;
      avatar.hidden = false;
    } else {
      avatar.removeAttribute("src");
      avatar.alt = "";
      avatar.hidden = true;
    }
  }
  button.style.setProperty("--quest-character-color", selectedVisual.classColor || "#d8aa43");

  menu.innerHTML = entries.map((entry) => {
    const key = entry.isAccountPicker ? "__account__" : questCharacterKey(entry);
    const visual = entry.isAccountPicker ? { image: "", className: "Compte", classColor: "#d8aa43" } : getQuestCharacterVisual(entry);
    const active = key === questsState.selectedKey;
    const portrait = visual.image
      ? `<img src="${escapeHtml(visual.image)}" alt="" loading="lazy">`
      : `<span class="quests-character-initial">${escapeHtml(String(entry.name || "?").slice(0, 1).toUpperCase())}</span>`;
    return `<button type="button" class="quests-character-option ${active ? "is-selected" : ""}" role="option" aria-selected="${active}" data-quest-character-key="${escapeHtml(key)}" style="--quest-character-color:${escapeHtml(visual.classColor || "#d8aa43")}">
      <span class="quests-character-option-avatar">${portrait}</span>
      <span class="quests-character-option-copy"><strong>${escapeHtml(entry.name || "Compte")}</strong><small>${escapeHtml(entry.isAccountPicker ? "Bande de guerre" : [visual.className, entry.realm].filter(Boolean).join(" · "))}</small></span>
      <span class="quests-character-option-check" aria-hidden="true">${active ? "✓" : ""}</span>
    </button>`;
  }).join("");

  menu.querySelectorAll("[data-quest-character-key]").forEach((option) => {
    option.addEventListener("click", () => {
      questsState.selectedKey = option.dataset.questCharacterKey;
      questsState.historyPage = 1;
      questsState.selectedContinent = "";
      questsState.selectedRegion = "";
      const native = document.getElementById("questsCharacterSelect");
      if (native) native.value = questsState.selectedKey;
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      renderQuestsView();
    });
  });
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
  renderQuestCharacterPicker(characters);
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
  panel.setAttribute("aria-hidden", "false");
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

  if (experience > 0) summary.push(`<div class="quest-reward-summary-item"><span class="quest-reward-symbol xp"><img src="https://wow.zamimg.com/images/wow/icons/large/achievement_level_10.jpg" alt="" loading="lazy"></span><span><strong>${experience.toLocaleString("fr-CA")} XP</strong><small>Expérience</small></span></div>`);
  if (money > 0) summary.push(`<div class="quest-reward-summary-item"><span class="quest-reward-symbol coins"><img src="https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_01.jpg" alt="" loading="lazy"></span><span><strong class="quest-money">${formatQuestMoney(money)}</strong><small>Argent</small></span></div>`);
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
  const status = quest.worldStatus || (quest.isComplete ? "completed" : "active");
  const statusLabel = status === "completed" ? "Terminée" : status === "todo" ? "À faire" : "En cours";

  content.innerHTML = `
    <header class="quest-details-docked-head">
      <div>
        <p class="quest-details-eyebrow">${escapeHtml(statusLabel)}</p>
        <h3 id="questDetailsTitle" class="quest-details-title">${escapeHtml(detail.title || quest.title || `Quête #${ids[0] || 0}`)}</h3>
      </div>
      <span class="quest-details-status is-${status}">${escapeHtml(statusLabel)}</span>
    </header>
    <div class="quest-details-meta">
      ${level > 0 ? `<span class="quest-details-chip">Niveau ${level}</span>` : ""}
      <span class="quest-details-chip">${escapeHtml(typeLabel)}</span>
      ${suggestedGroup > 0 ? `<span class="quest-details-chip">Groupe ${suggestedGroup}</span>` : ""}
    </div>

    <section class="quest-details-section quest-details-intro">
      ${objectiveText ? `<p class="quest-details-copy quest-objective-summary">${escapeHtml(objectiveText)}</p>` : ""}
      ${objectives.length ? `<ul class="quest-details-objectives">${objectives.map(renderQuestObjective).join("")}</ul>` : (objectiveText ? "" : '<p class="quest-details-muted">Aucun objectif détaillé disponible.</p>')}
    </section>

    <section class="quest-details-section">
      <h4>Description</h4>
      ${description ? `<p class="quest-details-copy">${escapeHtml(description)}</p>` : `<p class="quest-details-muted">${quest.archived ? "Cette quête historique a été retirée et aucun texte d'archive n'est encore disponible." : "Blizzard publie cette entrée technique sans description narrative."}</p>`}
      ${completionText ? `<p class="quest-details-copy quest-completion-copy">${escapeHtml(completionText)}</p>` : ""}
    </section>

    <section class="quest-details-section">
      <h4>Récompenses</h4>
      ${renderQuestRewards(quest.rewards || {})}
    </section>

    ${renderQuestTravel(quest, location)}
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

  document.querySelectorAll(".quest-world-row.is-selected").forEach((row) => row.classList.remove("is-selected"));
  document.querySelector(`[data-quest-detail-key="${CSS.escape(detailKey)}"]`)?.classList.add("is-selected");
  panel.setAttribute("aria-hidden", "false");

  if (window.matchMedia("(max-width: 1050px)").matches) {
    backdrop.hidden = false;
    panel.classList.add("is-open");
    document.body.classList.add("quest-details-open");
  }
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

function getQuestCatalogEntries() {
  return Object.values(questsState.database || {}).filter((quest) => quest && Number(quest.id || 0));
}

async function loadQuestCatalog() {
  if (questsState.questCatalog) return questsState.questCatalog;
  if (questsState.questCatalogPromise) return questsState.questCatalogPromise;

  questsState.questCatalogPromise = fetch("/data/quests/quest-catalog.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Quest Catalog indisponible.");
      return response.json();
    })
    .then((payload) => {
      questsState.questCatalog = payload && payload.regions ? payload : { regions: {} };
      return questsState.questCatalog;
    })
    .catch((error) => {
      console.warn(error.message || error);
      questsState.questCatalog = { regions: {} };
      return questsState.questCatalog;
    });

  return questsState.questCatalogPromise;
}

function getQuestCatalogRegion(continentName, regionName) {
  const regions = questsState.questCatalog?.regions || {};
  return regions[`${continentName}::${regionName}`] || null;
}

function buildQuestCatalogSelection(regionCatalog, activeIds, completedIds) {
  const raw = Array.isArray(regionCatalog?.quests) ? regionCatalog.quests : [];
  // Le catalogue complet reste visible, même lorsque le personnage n'a jamais
  // visité la région. Sa progression ne change que le statut des entrées.
  const target = raw.length;
  if (!target || !raw.length) return raw.slice();

  const byId = new Map(raw.map((quest) => [Number(quest.id || 0), quest]).filter(([id]) => id));
  const selected = [];
  const selectedIds = new Set();
  const pushId = (id) => {
    id = Number(id || 0);
    if (!id || selectedIds.has(id) || !byId.has(id) || selected.length >= target) return;
    selectedIds.add(id);
    selected.push(byId.get(id));
  };

  // La progression connue du personnage est prioritaire. Cela permet de rattacher
  // les anciennes quêtes terminées à leur région même si le Collector ne connaissait
  // pas la zone au moment où elles ont été faites.
  raw.forEach((quest) => {
    const id = Number(quest.id || 0);
    if (completedIds.has(id)) pushId(id);
  });
  raw.forEach((quest) => {
    const id = Number(quest.id || 0);
    if (activeIds.has(id)) pushId(id);
  });

  // V7 : complète ensuite jusqu'au total validé. Ces entrées sont de vraies références
  // questID du catalogue, jamais des lignes fictives calculées par soustraction.
  raw.forEach((quest) => pushId(quest.id));
  return selected;
}

async function loadQuestWorldCatalog() {
  if (questsState.worldCatalog) return questsState.worldCatalog;
  if (questsState.worldCatalogPromise) return questsState.worldCatalogPromise;

  questsState.worldCatalogPromise = fetch("/data/quests/world-catalog.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Catalogue mondial indisponible.");
      return response.json();
    })
    .then((payload) => {
      questsState.worldCatalog = payload && Array.isArray(payload.continents) ? payload : { continents: [] };
      return questsState.worldCatalog;
    })
    .catch((error) => {
      console.warn(error.message || error);
      questsState.worldCatalog = { continents: [] };
      return questsState.worldCatalog;
    });

  return questsState.worldCatalogPromise;
}

function normalizeQuestWorldKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fr");
}

function buildQuestWorldLookup() {
  const continents = Array.isArray(questsState.worldCatalog?.continents) ? questsState.worldCatalog.continents : [];
  const continentByAlias = new Map();
  const regionByAlias = new Map();

  continents.forEach((continent) => {
    [continent.name, ...(continent.aliases || [])].forEach((alias) => {
      const key = normalizeQuestWorldKey(alias);
      if (key) continentByAlias.set(key, continent);
    });
    (continent.regions || []).forEach((region) => {
      [region.name, ...(region.aliases || [])].forEach((alias) => {
        const key = normalizeQuestWorldKey(alias);
        if (key) regionByAlias.set(key, { continent, region });
      });
    });
  });
  return { continentByAlias, regionByAlias };
}

function getWorldCatalogRegionMeta(continentName, regionName) {
  const lookup = buildQuestWorldLookup();
  const direct = lookup.regionByAlias.get(normalizeQuestWorldKey(regionName));
  if (direct) return direct.region;
  const continent = lookup.continentByAlias.get(normalizeQuestWorldKey(continentName));
  return continent?.regions?.find((region) => normalizeQuestWorldKey(region.name) === normalizeQuestWorldKey(regionName)) || null;
}

function normalizeWorldLabel(value, fallback) {
  const label = String(value || "").trim();
  return label || fallback;
}

function getSelectedQuestCollectorCharacter() {
  const selected = getSelectedQuestCharacter();
  if (!selected || questsState.selectedKey === "__account__") return null;
  return getCollectorCharacter(selected);
}

function getCurrentQuestWorldLocation() {
  const collectorCharacter = getSelectedQuestCollectorCharacter();
  const location = collectorCharacter?.location || {};
  const candidates = [location.subZone, location.zone].filter(Boolean);
  if (!candidates.length) return { continent: "", region: "", labels: [] };

  const lookup = buildQuestWorldLookup();
  for (const label of candidates) {
    const match = lookup.regionByAlias.get(normalizeQuestWorldKey(label));
    if (match) {
      return { continent: match.continent.name, region: match.region.name, labels: candidates };
    }
  }

  for (const label of candidates) {
    const continent = lookup.continentByAlias.get(normalizeQuestWorldKey(label));
    if (continent) return { continent: continent.name, region: "", labels: candidates };
  }

  return { continent: "", region: candidates[0] || "", labels: candidates };
}

function questWorldStatus(quest, activeIds, completedIds) {
  const id = Number(quest?.id || 0);
  if (id && activeIds.has(id)) return "active";
  if (id && completedIds.has(id)) return "completed";
  return "todo";
}

function buildQuestWorldModel(character) {
  const active = [...(character?.active || [])];
  const history = [...(character?.completedHistory || [])];
  const activeIds = new Set(active.map((quest) => Number(quest.id || 0)).filter(Boolean));
  const completedIds = new Set(history.map((quest) => Number(quest.id || 0)).filter(Boolean));
  const byId = new Map();
  const knownById = new Map();
  getQuestCatalogEntries().forEach((quest) => knownById.set(Number(quest.id), quest));
  history.forEach((quest) => {
    const id = Number(quest.id || 0);
    if (id) knownById.set(id, mergeQuestKnowledge(quest, knownById.get(id) || {}));
  });
  active.forEach((quest) => {
    const id = Number(quest.id || 0);
    if (id) knownById.set(id, mergeQuestKnowledge(quest, knownById.get(id) || {}));
  });
  const worldLookup = buildQuestWorldLookup();
  const continents = new Map();
  const continentMeta = new Map();
  const regionMeta = new Map();

  const worldContinents = Array.isArray(questsState.worldCatalog?.continents) ? questsState.worldCatalog.continents : [];
  worldContinents
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .forEach((continent) => {
      const regions = new Map();
      (continent.regions || [])
        .slice()
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .forEach((region) => {
          regions.set(region.name, []);
          regionMeta.set(`${continent.name}::${region.name}`, region);
        });
      continents.set(continent.name, regions);
      continentMeta.set(continent.name, continent);
    });

  const catalogRegionIndex = new Map();
  const catalogRegions = questsState.questCatalog?.regions || {};
  Object.values(catalogRegions).forEach((regionCatalog) => {
    const rawCatalogQuests = Array.isArray(regionCatalog?.quests) ? regionCatalog.quests : [];
    rawCatalogQuests.forEach((quest) => {
      const id = Number(quest.id || 0);
      if (!id) return;
      catalogRegionIndex.set(id, {
        continentName: regionCatalog.continentName,
        regionName: regionCatalog.regionName,
        mapID: regionCatalog.mapID,
      });
    });

    const selectedCatalogQuests = buildQuestCatalogSelection(regionCatalog, activeIds, completedIds);
    selectedCatalogQuests.forEach((quest) => {
      const id = Number(quest.id || 0);
      if (!id) return;
      const existing = knownById.get(id) || {};
      const catalogKey = `catalog:${regionCatalog.continentName}:${regionCatalog.regionName}:${id}`;
      byId.set(catalogKey, mergeQuestKnowledge(existing, {
        ...quest,
        id,
        title: existing.title || quest.title || `Quête #${id}`,
        continentName: regionCatalog.continentName,
        regionName: regionCatalog.regionName,
        mapID: regionCatalog.mapID,
        mapName: regionCatalog.regionName,
        catalogEntry: true,
        catalogTitlePending: !existing.title && !quest.title,
      }));
    });
  });

  knownById.forEach((quest, id) => {
    // Une quête absente du catalogue mondial reste visible grâce au Collector.
    if (!catalogRegionIndex.has(id)) byId.set(id, quest);
  });

  [...byId.values()].forEach((quest) => {
    const catalogLocation = catalogRegionIndex.get(Number(quest.id || 0));
    if (catalogLocation && !quest.catalogEntry) {
      quest.continentName = catalogLocation.continentName || quest.continentName;
      quest.regionName = catalogLocation.regionName || quest.regionName;
      quest.mapID = catalogLocation.mapID || quest.mapID;
      quest.mapName = catalogLocation.regionName || quest.mapName;
    }
    const rawRegion = normalizeWorldLabel(
      firstUsefulValue(
        quest.regionName,
        quest.region,
        quest.mapName,
        quest.zoneName,
        quest.areaName,
        quest.journalHeader,
        quest.questLogHeader,
      ),
      "Historique non classé",
    );
    const matchedRegion = worldLookup.regionByAlias.get(normalizeQuestWorldKey(rawRegion));
    const rawContinent = firstUsefulValue(quest.continentName, quest.continent, quest.worldName);
    const matchedContinent = worldLookup.continentByAlias.get(normalizeQuestWorldKey(rawContinent));
    const continent = matchedRegion?.continent?.name
      || matchedContinent?.name
      || normalizeWorldLabel(rawContinent, "Azeroth");
    const region = matchedRegion?.region?.name || rawRegion;
    const status = questWorldStatus(quest, activeIds, completedIds);
    quest.worldStatus = status;
    quest.continentName = continent;
    quest.regionName = region;

    if (!continents.has(continent)) {
      continents.set(continent, new Map());
      continentMeta.set(continent, { name: continent, order: 999, image: "/assets/home-hero-azeroth-sharp.jpg", expansion: "Découvert par le Collector" });
    }
    const regions = continents.get(continent);
    if (!regions.has(region)) {
      regions.set(region, []);
      regionMeta.set(`${continent}::${region}`, { name: region, order: 999, image: getQuestRegionImage([quest]), catalogQuestCount: 0, discovered: true });
    }
    regions.get(region).push(quest);
  });

  const currentLocation = getCurrentQuestWorldLocation();
  return { continents, active, history, activeIds, completedIds, continentMeta, regionMeta, currentLocation };
}

function getRegionStats(quests = [], regionMeta = null) {
  const knownTotal = quests.length;
  const catalogTotal = Math.max(0, Number(regionMeta?.catalogQuestCount || 0));
  const total = Math.max(knownTotal, catalogTotal);
  const completed = quests.filter((quest) => quest.worldStatus === "completed").length;
  const active = quests.filter((quest) => quest.worldStatus === "active").length;
  const detailedTodo = quests.filter((quest) => quest.worldStatus === "todo").length;
  const todo = Math.max(detailedTodo, total - completed - active);
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, knownTotal, catalogTotal, completed, active, todo, percent };
}

function getContinentStats(regions, model, continentName) {
  const allQuests = [...regions.values()].flat();
  const completed = allQuests.filter((quest) => quest.worldStatus === "completed").length;
  const active = allQuests.filter((quest) => quest.worldStatus === "active").length;
  let total = 0;
  regions.forEach((quests, regionName) => {
    const meta = model.regionMeta?.get(`${continentName}::${regionName}`);
    total += getRegionStats(quests, meta).total;
  });
  const todo = Math.max(0, total - completed - active);
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, active, todo, percent };
}

function getQuestMapArtUrl(mapID) {
  const id = Number(mapID || 0);
  if (!id) return "";
  // Local CASC render: no hotlink, no confusion between the legacy Wowhead
  // zone IDs and Blizzard's current uiMapID values.
  if (id === 10) return "/assets/maps/world/10-full.jpg";
  return `/assets/maps/world/${id}.webp`;
}

function getQuestContinentArt(meta = null) {
  const id = Number(meta?.mapID || meta?.uiMapID || 0);
  if (!id) return "";
  const extension = id === 572 ? "png" : "jpg";
  return `/assets/maps/continents/${id}.${extension}`;
}

function getQuestRegionFallbackImage(quests = [], meta = null) {
  const sample = quests.find((quest) => quest.regionImage || quest.image || quest.mediaUrl);
  return firstUsefulValue(sample?.regionImage, sample?.image, sample?.mediaUrl, meta?.image, "/assets/home-hero-azeroth-sharp.jpg");
}

function getQuestRegionMapID(quests = [], meta = null) {
  const sample = quests.find((quest) => Number(quest.mapID || quest.uiMapID || 0));
  // The world catalog is authoritative for a continent/region illustration.
  // Using a quest first made Kalimdor show that quest's zone instead of map 12.
  return Number(firstUsefulValue(meta?.mapID, meta?.uiMapID, sample?.mapID, sample?.uiMapID, 0)) || 0;
}

function getQuestRegionImage(quests = [], meta = null) {
  return firstUsefulValue(getQuestMapArtUrl(getQuestRegionMapID(quests, meta)), getQuestRegionFallbackImage(quests, meta));
}

function renderQuestWorldNavigation(model) {
  const continentNav = document.getElementById("questsContinentNav");
  const regionsGrid = document.getElementById("questsRegionsGrid");
  const regionColumnTitle = document.getElementById("questsRegionsColumnTitle");
  if (!continentNav || !regionsGrid) return;

  const currentContinent = model.currentLocation?.continent || "";
  const currentRegion = model.currentLocation?.region || "";
  const continentNames = [...model.continents.keys()].sort((a, b) => {
    if (a === currentContinent && b !== currentContinent) return -1;
    if (b === currentContinent && a !== currentContinent) return 1;
    const ma = model.continentMeta?.get(a);
    const mb = model.continentMeta?.get(b);
    return (Number(ma?.order || 999) - Number(mb?.order || 999)) || a.localeCompare(b, "fr");
  });
  if (!continentNames.length) {
    continentNav.innerHTML = "";
    regionsGrid.innerHTML = '<div class="quest-empty"><strong>Aucune région connue</strong><br><small>Le Collector et le catalogue Azer Companion alimenteront cette carte.</small></div>';
    return;
  }

  if (!questsState.selectedContinent || !model.continents.has(questsState.selectedContinent)) {
    questsState.selectedContinent = currentContinent && model.continents.has(currentContinent)
      ? currentContinent
      : continentNames[0];
    questsState.selectedRegion = "";
  }

  continentNav.innerHTML = continentNames.map((name) => {
    const regions = model.continents.get(name);
    const allQuests = [...regions.values()].flat();
    const stats = getContinentStats(regions, model, name);
    const meta = model.continentMeta?.get(name);
    const image = firstUsefulValue(getQuestContinentArt(meta), getQuestRegionImage(allQuests, meta));
    const regionCount = regions.size;
    const fallbackImage = getQuestRegionFallbackImage(allQuests, meta);
    return `<button type="button" class="quest-continent-tab ${name === questsState.selectedContinent ? "is-active" : ""}" data-quest-continent="${escapeHtml(name)}" aria-pressed="${name === questsState.selectedContinent}" style="--quest-card-image:url('${escapeHtml(image)}');--quest-card-fallback-image:url('${escapeHtml(fallbackImage)}')">
      <span class="quest-nav-art" aria-hidden="true"></span>
      <span class="quest-nav-copy"><strong>${escapeHtml(name)}</strong><small>${stats.completed} / ${stats.total} (${stats.percent}%)</small><em>${regionCount} régions · ${escapeHtml(meta?.expansion || "")}</em></span>
    </button>`;
  }).join("");

  const selectedRegions = model.continents.get(questsState.selectedContinent) || new Map();
  const regionEntries = [...selectedRegions.entries()].sort(([a], [b]) => {
    if (questsState.selectedContinent === currentContinent) {
      if (a === currentRegion && b !== currentRegion) return -1;
      if (b === currentRegion && a !== currentRegion) return 1;
    }
    const ma = model.regionMeta?.get(`${questsState.selectedContinent}::${a}`);
    const mb = model.regionMeta?.get(`${questsState.selectedContinent}::${b}`);
    return (Number(ma?.order || 999) - Number(mb?.order || 999)) || a.localeCompare(b, "fr");
  });
  if (!questsState.selectedRegion || !selectedRegions.has(questsState.selectedRegion)) {
    const currentExists = questsState.selectedContinent === currentContinent && currentRegion && selectedRegions.has(currentRegion);
    const withQuests = regionEntries.find(([, quests]) => quests.length > 0);
    questsState.selectedRegion = currentExists ? currentRegion : (withQuests?.[0] || regionEntries[0]?.[0] || "");
  }
  if (regionColumnTitle) regionColumnTitle.textContent = `RÉGIONS · ${questsState.selectedContinent}`;

  regionsGrid.innerHTML = regionEntries.map(([name, quests]) => {
    const meta = model.regionMeta?.get(`${questsState.selectedContinent}::${name}`);
    const stats = getRegionStats(quests, meta);
    const image = getQuestRegionImage(quests, meta);
    const emptyClass = stats.total === 0 ? "is-catalog-empty" : "";
    const isCurrentRegion = questsState.selectedContinent === currentContinent && name === currentRegion;
    const fallbackImage = getQuestRegionFallbackImage(quests, meta);
    return `<button class="quest-region-card ${name === questsState.selectedRegion ? "is-selected" : ""} ${isCurrentRegion ? "is-current" : ""} ${emptyClass}" type="button" data-quest-region="${escapeHtml(name)}" aria-pressed="${name === questsState.selectedRegion}" style="--quest-region-image:url('${escapeHtml(image)}');--quest-region-fallback-image:url('${escapeHtml(fallbackImage)}')">
      <span class="quest-region-thumb" aria-hidden="true"></span>
      <span class="quest-region-content">
        <strong>${escapeHtml(name)}</strong>
        <small>${stats.total ? `${stats.completed} / ${stats.total} (${stats.percent}%)` : "Catalogue à alimenter"}</small>
      </span>
    </button>`;
  }).join("");

  continentNav.querySelectorAll("[data-quest-continent]").forEach((button) => {
    button.addEventListener("click", () => {
      questsState.selectedContinent = button.dataset.questContinent;
      questsState.selectedRegion = "";
      questsState.statusFilter = "all";
      renderQuestsView();
    });
  });
  regionsGrid.querySelectorAll("[data-quest-region]").forEach((button) => {
    button.addEventListener("click", () => {
      questsState.selectedRegion = button.dataset.questRegion;
      questsState.statusFilter = "all";
      renderQuestsView();
    });
  });
}

function renderRegionQuestList(model, character, isAccountView) {
  const detail = document.getElementById("questsRegionDetail");
  const grid = document.getElementById("questsGrid");
  if (!detail || !grid) return;
  const regions = model.continents.get(questsState.selectedContinent);
  const quests = regions?.get(questsState.selectedRegion) || [];

  if (!questsState.selectedRegion) {
    detail.hidden = true;
    grid.innerHTML = "";
    return;
  }

  detail.hidden = false;
  const regionMeta = model.regionMeta?.get(`${questsState.selectedContinent}::${questsState.selectedRegion}`);
  const stats = getRegionStats(quests, regionMeta);
  const hero = document.getElementById("questsRegionHero");
  if (hero) {
    hero.style.setProperty("--quest-region-hero-image", `url('${getQuestRegionImage(quests, regionMeta)}')`);
    hero.style.setProperty("--quest-region-hero-fallback-image", `url('${getQuestRegionFallbackImage(quests, regionMeta)}')`);
  }
  document.getElementById("questsRegionTitle").textContent = questsState.selectedRegion;
  document.getElementById("questsRegionSubtitle").textContent = questsState.selectedContinent;
  document.getElementById("questsRegionPercent").textContent = `${stats.percent}%`;
  document.getElementById("questsRegionProgressBar").style.width = `${stats.percent}%`;
  document.getElementById("questsRegionProgressText").textContent = `${stats.completed} terminées · ${stats.active} en cours · ${stats.todo} à faire`;
  document.getElementById("questsRegionCompletedText").textContent = `${stats.completed} / ${stats.total} quêtes terminées`;
  document.getElementById("questsFilterAllCount").textContent = String(stats.total);
  document.getElementById("questsFilterActiveCount").textContent = String(stats.active);
  document.getElementById("questsFilterCompletedCount").textContent = String(stats.completed);
  document.getElementById("questsFilterTodoCount").textContent = String(stats.todo);

  detail.querySelectorAll("[data-quest-status-filter]").forEach((button) => {
    const isActive = button.dataset.questStatusFilter === questsState.statusFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.onclick = () => {
      questsState.statusFilter = button.dataset.questStatusFilter;
      renderQuestsView();
    };
  });

  const visible = quests
    .filter((quest) => questsState.statusFilter === "all" || quest.worldStatus === questsState.statusFilter)
    .sort((a, b) => {
      const rank = { active: 0, completed: 1, todo: 2 };
      return (rank[a.worldStatus] - rank[b.worldStatus]) || String(a.title || "").localeCompare(String(b.title || ""), "fr");
    });

  document.getElementById("questsListCount").textContent = `Quêtes (${visible.length})`;
  let firstDetailKey = "";
  grid.innerHTML = visible.length ? visible.map((quest, index) => {
    const id = Number(quest.id || 0);
    const status = quest.worldStatus;
    const statusLabel = status === "completed" ? "Terminée" : status === "active" ? "En cours" : "À faire";
    const detailKey = `world:${id}:${index}`;
    if (!firstDetailKey) firstDetailKey = detailKey;
    questsState.detailIndex.set(detailKey, { quest, title: quest.title || `Quête #${id}`, ids: id ? [id] : [], mapName: quest.mapName || questsState.selectedRegion, isAccountView });
    const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
    const objective = quest.catalogTitlePending
      ? `QuestID ${id} · fiche Blizzard à enrichir`
      : (quest.objectiveText || objectives[0]?.text || quest.description || "Détails disponibles au clic.");
    const level = Number(quest.level || 0);
    const stateMark = status === "completed" ? "✓" : status === "active" ? "!" : "!";
    return `<article class="quest-world-row is-${status}" data-quest-detail-key="${escapeHtml(detailKey)}" tabindex="0" role="button">
      <span class="quest-world-state" aria-hidden="true"><i>${stateMark}</i></span>
      <span class="quest-world-copy">
        <span class="quest-world-title-line"><strong>${escapeHtml(quest.title || `Quête #${id}`)}</strong><small class="quest-world-status-label">${escapeHtml(statusLabel)}</small></span>
        <em>${escapeHtml(objective)}</em>
      </span>
      <span class="quest-world-meta"><b>${level > 0 ? `Niveau ${level}` : ""}</b><small>${escapeHtml(getQuestTypeLabel(quest, isAccountView))}</small></span>
      <span class="quest-world-arrow" aria-hidden="true">›</span>
    </article>`;
  }).join("") : `<div class="quest-empty quest-catalog-empty"><strong>${stats.total ? "Catalogue détaillé en cours d’enrichissement" : "Région prête dans le catalogue"}</strong><br><small>${stats.total ? `${stats.total} quêtes sont connues pour cette région. Les fiches individuelles apparaîtront à mesure que leurs questID seront enrichis.` : "Cette région est maintenant connue d’Azer Companion. Les quêtes apparaîtront automatiquement dès qu’elles seront importées dans le Quest Catalog Engine."}</small></div>`;

  bindQuestDetailsTriggers(grid);
  if (firstDetailKey) requestAnimationFrame(() => openQuestDetails(firstDetailKey));
}

function renderQuestsView() {
  const grid = document.getElementById("questsGrid");
  const completedList = document.getElementById("questsCompletedList");
  if (!grid) return;
  // V9: le Journal du Collector est retire de la vue Quetes.
  // On garde completedList optionnel pour compatibilite avec un ancien carnet.ejs.
  if (completedList) {
    const legacyJournal = completedList.closest(".quest-recent-completions") || completedList.parentElement;
    if (legacyJournal) legacyJournal.hidden = true;
  }

  renderQuestCharacterOptions();
  const character = getSelectedQuestCharacter();
  const isAccountView = questsState.selectedKey === "__account__";
  questsState.detailIndex = new Map();

  if (!character) {
    grid.innerHTML = '<div class="quest-empty"><strong>Aucune donnée de quête</strong><br><small>Lance /azer scan dans WoW, puis /reload.</small></div>';
    if (completedList) completedList.innerHTML = "";
    return;
  }

  const model = buildQuestWorldModel(character);
  const groupedHistory = groupQuestHistoryByTitle(model.history);
  const remainingObjectives = model.active.reduce(
    (total, quest) => total + (quest.objectives || []).filter((objective) => !objective.finished).length,
    0,
  );
  const catalogIds = new Set(getQuestCatalogEntries().map((quest) => Number(quest.id || 0)).filter(Boolean));
  const todoKnown = [...catalogIds].filter((id) => !model.activeIds.has(id) && !model.completedIds.has(id)).length;

  document.getElementById("questsActiveCount").textContent = String(model.active.length);
  document.getElementById("questsObjectivesCount").textContent = String(remainingObjectives);
  document.getElementById("questsCompletedCount").textContent = String(groupedHistory.length);
  document.getElementById("questsAccountSharedCount").textContent = String(todoKnown);
  document.getElementById("questsActiveLabel").textContent = isAccountView ? "Quêtes actives du compte" : "Quêtes en cours";
  document.getElementById("questsObjectivesLabel").textContent = "Objectifs à terminer";
  document.getElementById("questsCompletedLabel").textContent = "Quêtes terminées connues";
  document.getElementById("questsAccountSharedLabel").textContent = "Quêtes à faire cataloguées";

  renderQuestWorldNavigation(model);
  renderRegionQuestList(model, character, isAccountView);

  const recent = [...(character?.completedObserved || [])]
    .sort((a, b) => Number(b.completedAt || 0) - Number(a.completedAt || 0))
    .slice(0, 8);
  // V9: l'historique recent reste disponible dans les donnees, mais n'est plus
  // rendu sous l'Atlas afin de conserver un vrai one-pager.
  if (completedList) {
    completedList.innerHTML = "";
  }
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
    await Promise.all([loadQuestDatabase(), loadQuestWorldCatalog(), loadQuestCatalog()]);
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

const questsCharacterButton = document.getElementById("questsCharacterButton");
const questsCharacterMenu = document.getElementById("questsCharacterMenu");
questsCharacterButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!questsCharacterMenu) return;
  questsCharacterMenu.hidden = !questsCharacterMenu.hidden;
  questsCharacterButton.setAttribute("aria-expanded", questsCharacterMenu.hidden ? "false" : "true");
});
document.addEventListener("click", (event) => {
  const picker = document.getElementById("questsCharacterPicker");
  if (!picker?.contains(event.target) && questsCharacterMenu && !questsCharacterMenu.hidden) {
    questsCharacterMenu.hidden = true;
    questsCharacterButton?.setAttribute("aria-expanded", "false");
  }
});

document.getElementById("questsCharacterSelect")?.addEventListener("change", (event) => {
  questsState.selectedKey = event.target.value;
  questsState.historyPage = 1;
  questsState.selectedContinent = "";
  questsState.selectedRegion = "";
  renderQuestsView();
});

document.getElementById("questDetailsClose")?.addEventListener("click", closeQuestDetails);
document.getElementById("questDetailsBackdrop")?.addEventListener("click", closeQuestDetails);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQuestDetails();
});
