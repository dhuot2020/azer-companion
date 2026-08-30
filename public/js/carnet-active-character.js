// ============================================================
// CARNET -> PERSONNAGE ACTIF
// ============================================================

async function loadCarnetActiveCharacter() {
  const response = await fetch(
    "/api/carnet/context",
    {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Impossible de charger le personnage actif (${response.status}).`,
    );
  }

  const data = await response.json();

  renderActiveCharacter(
    data.character || null,
  );

  return data.character || null;
}


function renderActiveCharacter(character) {
  const emptyElements =
    document.querySelectorAll(
      "[data-active-character-empty]",
    );

  const contentElements =
    document.querySelectorAll(
      "[data-active-character-content]",
    );

  if (!character) {
    emptyElements.forEach((element) => {
      element.hidden = false;
    });

    contentElements.forEach((element) => {
      element.hidden = true;
    });

    return;
  }

  emptyElements.forEach((element) => {
    element.hidden = true;
  });

  contentElements.forEach((element) => {
    element.hidden = false;
  });

  setText(
    "[data-active-character-name]",
    character.name,
  );

  setText(
    "[data-active-character-level]",
    character.level ?? "—",
  );

  setText(
    "[data-active-character-realm]",
    character.realm_name ||
      character.realm_slug ||
      "—",
  );

  setText(
    "[data-active-character-id]",
    character.id,
  );

  setText(
    "[data-active-character-blizzard-id]",
    character.blizzard_character_id || "—",
  );

  // Le titre "Bon retour" peut etre gere sans
  // remplacer le reste de la page.
  document
    .querySelectorAll(
      "[data-active-character-welcome]",
    )
    .forEach((element) => {
      element.textContent =
        `Bon retour, ${character.name}.`;
    });
}


function setText(selector, value) {
  document
    .querySelectorAll(selector)
    .forEach((element) => {
      element.textContent =
        value == null ? "—" : String(value);
    });
}


document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadCarnetActiveCharacter()
      .catch((error) => {
        console.error(
          "Erreur personnage actif du Carnet :",
          error,
        );
      });
  },
);


// Si le Pack 24 change le personnage actif
// sans recharger la page, on rafraichit le Carnet.
document.addEventListener(
  "azer:active-character-changed",
  () => {
    loadCarnetActiveCharacter()
      .catch(console.error);
  },
);
