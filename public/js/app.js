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
  const storageKey = "azerCompanion.sidebarCollapsed";

  if (!shell || !sidebar || !handle) {
    return;
  }

  function getSavedState() {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch (error) {
      console.warn("Impossible de lire l’état de la sidebar.", error);
      return false;
    }
  }

  function saveState(isCollapsed) {
    try {
      localStorage.setItem(storageKey, String(isCollapsed));
    } catch (error) {
      console.warn("Impossible de sauvegarder l’état de la sidebar.", error);
    }
  }

  function renderSidebar(isCollapsed, persist = true) {
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

    if (persist && desktopMedia.matches) {
      saveState(desktopCollapsed);
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

  desktopMedia.addEventListener("change", (event) => {
    sidebar.classList.remove("is-open");

    if (event.matches) {
      renderSidebar(getSavedState(), false);
    } else {
      renderSidebar(false, false);
    }
  });

  renderSidebar(getSavedState(), false);
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

    const characterModalOpen =
      document.getElementById("characters-modal") &&
      !document.getElementById("characters-modal").classList.contains("hidden");

    if (isTyping || characterModalOpen) return;

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
// Fenêtre Mes personnages
// ======================================================

const characterButton = document.getElementById("character-switch-button");
const charactersModal = document.getElementById("characters-modal");
const closeCharactersButton = document.getElementById("closeCharacters");
const charactersList = document.getElementById("characters-list");
const charactersSearchInput = document.getElementById(
  "characters-search-input",
);
const charactersCount = document.getElementById("characters-count");

let blizzardCharacters = [];
let currentFactionFilter = "all";
let currentCharacterName =
  document.getElementById("hero-name")?.textContent?.trim() || "Ombreloup";

// ======================================================
// Informations de classe
// ======================================================

const classDetails = {
  1: {
    name: "Guerrier",
    color: "#c69b6d",
    icon: "⚔",
  },

  2: {
    name: "Paladin",
    color: "#f48cba",
    icon: "✦",
  },

  3: {
    name: "Chasseur",
    color: "#aad372",
    icon: "➶",
  },

  4: {
    name: "Voleur",
    color: "#fff468",
    icon: "🗡",
  },

  5: {
    name: "Prêtre",
    color: "#ffffff",
    icon: "✧",
  },

  6: {
    name: "Chevalier de la mort",
    color: "#c41e3a",
    icon: "☠",
  },

  7: {
    name: "Chaman",
    color: "#0070dd",
    icon: "ϟ",
  },

  8: {
    name: "Mage",
    color: "#3fc7eb",
    icon: "✺",
  },

  9: {
    name: "Démoniste",
    color: "#8788ee",
    icon: "♆",
  },

  10: {
    name: "Moine",
    color: "#00ff98",
    icon: "☯",
  },

  11: {
    name: "Druide",
    color: "#ff7c0a",
    icon: "❋",
  },

  12: {
    name: "Chasseur de démons",
    color: "#a330c9",
    icon: "◈",
  },

  13: {
    name: "Évocateur",
    color: "#33937f",
    icon: "✥",
  },
};

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
// Portraits locaux temporaires
// ======================================================

function getCharacterImage(character) {
  const characterImages = {
    ombreloup: "/assets/avatar-ombreloup.png",
    danielboone: "/assets/characters/danielboone.jpg",
    poutchie: "/assets/characters/poutchie.jpg",
    floralune: "/assets/characters/floralune.jpg",
    tanakio: "/assets/characters/tanakio.jpg",
  };

  const characterKey = character.name.toLowerCase();

  return (
    characterImages[characterKey] || "/assets/characters/default-character.jpg"
  );
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
  card.dataset.faction = character.factionName;

  if (character.name.toLowerCase() === currentCharacterName.toLowerCase()) {
    card.classList.add("active-character");
  }

  card.style.setProperty("--class-color", character.classColor);
  card.style.setProperty("--character-image", `url("${character.image}")`);

  card.innerHTML = `
    <div class="character-card-inner">

      <section class="character-card-face character-card-front">

        <div class="character-card-background"></div>
        <div class="character-card-shade"></div>

        <div class="character-faction-emblem">
          <span>♜</span>
        </div>

        <div class="character-active-label">
          <span>★</span>
          Actif
        </div>

        <div class="character-level-medallion">
          <strong>${character.level}</strong>
          <span>Niveau</span>
        </div>

        <div class="character-card-front-content">
          <span class="character-class-medallion">
            ${character.classIcon}
          </span>

          <h3>${character.name}</h3>

          <strong class="character-class-name">
            ${character.className}
          </strong>

          <span class="character-realm">
            ${character.realm}
          </span>

          <span class="character-faction-name">
            ${character.factionName}
          </span>
        </div>

        <button
          class="character-flip-button"
          type="button"
          aria-label="Voir les détails de ${character.name}"
        >
          ↔
        </button>

      </section>

      <section class="character-card-face character-card-back">

        <div class="character-card-back-emblem">
          ♜
        </div>

        <h3>${character.name}</h3>

        <strong
          class="character-back-class"
          style="color: ${character.classColor}"
        >
          ${character.className}
        </strong>

        <div class="character-details">

          <div>
            <span>Race</span>
            <strong>${character.raceName}</strong>
          </div>

          <div>
            <span>Faction</span>
            <strong>${character.factionName}</strong>
          </div>

          <div>
            <span>Royaume</span>
            <strong>${character.realm}</strong>
          </div>

          <div>
            <span>Niveau</span>
            <strong>${character.level}</strong>
          </div>

        </div>

        <button
          class="select-character-button"
          type="button"
        >
          Choisir ce personnage
        </button>

        <button
          class="character-flip-button character-flip-button-back"
          type="button"
          aria-label="Retourner la carte"
        >
          ↔
        </button>

      </section>

    </div>
  `;

  const flipButtons = card.querySelectorAll(".character-flip-button");

  flipButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      card.classList.toggle("flipped");
    });
  });

  const selectButton = card.querySelector(".select-character-button");

  selectButton.addEventListener("click", (event) => {
    event.stopPropagation();
    selectCharacter(character);
  });

  card.addEventListener("click", (event) => {
    if (
      event.target.closest(".select-character-button") ||
      event.target.closest(".character-flip-button")
    ) {
      return;
    }

    card.classList.toggle("flipped");
  });

  return card;
}

// ======================================================
// Affichage des cartes
// ======================================================

function renderCharacters() {
  const searchValue = String(charactersSearchInput?.value || "")
    .trim()
    .toLowerCase();

  const filteredCharacters = blizzardCharacters.filter((character) => {
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

  filteredCharacters.forEach((character) => {
    charactersList.appendChild(createCharacterCard(character));
  });
}

// ======================================================
// Sélection du personnage
// ======================================================

function selectCharacter(character) {
  currentCharacterName = character.name;

  document.querySelectorAll(".character-card").forEach((card) => {
    card.classList.toggle(
      "active-character",
      card.dataset.characterName.toLowerCase() ===
        currentCharacterName.toLowerCase(),
    );
  });

  const heroName = document.getElementById("hero-name");
  const heroPlayerName = document.getElementById("hero-player-name");
  const heroClass = document.getElementById("hero-class");
  const heroRace = document.getElementById("hero-race");
  const heroFaction = document.getElementById("hero-faction");
  const heroLevel = document.getElementById("hero-level");
  const heroAvatar = document.getElementById("hero-avatar");

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

  if (heroLevel) {
    heroLevel.textContent = character.level;
  }

  if (heroAvatar) {
    heroAvatar.src = character.image;
    heroAvatar.alt = `Portrait de ${character.name}`;
  }

  charactersModal.classList.add("hidden");
}

// ======================================================
// Chargement depuis Blizzard
// ======================================================

async function loadCharacters() {
  charactersList.innerHTML = `
    <div class="characters-loading">
      Chargement des personnages...
    </div>
  `;

  try {
    const response = await fetch("/api/characters");

    if (response.status === 401) {
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

    blizzardCharacters = (data.characters || []).map(normalizeCharacter);

    if (charactersCount) {
      charactersCount.textContent = blizzardCharacters.length;
    }

    renderCharacters();
  } catch (error) {
    console.error(error);

    charactersList.innerHTML = `
      <div class="characters-empty">
        Impossible de charger les personnages Battle.net.
      </div>
    `;
  }
}

// ======================================================
// Ouverture et fermeture
// ======================================================

function openCharactersModal() {
  charactersModal.classList.remove("hidden");

  if (!blizzardCharacters.length) {
    loadCharacters();
  } else {
    renderCharacters();
  }
}

function closeCharactersModal() {
  charactersModal.classList.add("hidden");

  document.querySelectorAll(".character-card.flipped").forEach((card) => {
    card.classList.remove("flipped");
  });
}

characterButton?.addEventListener("click", openCharactersModal);
closeCharactersButton?.addEventListener("click", closeCharactersModal);

document.querySelectorAll("[data-close-characters]").forEach((element) => {
  element.addEventListener("click", closeCharactersModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !charactersModal.classList.contains("hidden")) {
    closeCharactersModal();
  }
});

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
