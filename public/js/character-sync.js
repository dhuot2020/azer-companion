// ============================================================
// AZER COMPAGNION - CHARACTER SYNC
// ============================================================

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Accept": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message ||
      data?.error ||
      `HTTP ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


async function loadCharacters() {
  const container =
    document.querySelector(
      "[data-character-list]"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    `<p>Chargement des personnages...</p>`;

  try {
    const data = await fetchJson(
      "/api/characters"
    );

    if (!data.characters?.length) {
      container.innerHTML = `
        <div class="character-empty">
          <p>Aucun personnage synchronisé.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      data.characters
        .map((character) => {
          const realm =
            character.realm_name ||
            character.realm_slug ||
            "Royaume inconnu";

          const level =
            character.level ?? "?";

          return `
            <button
              type="button"
              class="character-card"
              data-character-id="${character.id}"
            >
              <span class="character-card__name">
                ${escapeHtml(character.name)}
              </span>

              <span class="character-card__meta">
                ${escapeHtml(realm)}
                · Niveau ${escapeHtml(String(level))}
              </span>
            </button>
          `;
        })
        .join("");
  } catch (error) {
    if (error.status === 401) {
      container.innerHTML = `
        <div class="character-empty">
          <p>Connexion Battle.net requise.</p>

          <a
            class="character-sync-button"
            href="/api/auth/battlenet"
          >
            Se connecter à Battle.net
          </a>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <p>
        Impossible de charger les personnages.
      </p>
    `;

    console.error(
      "Erreur loadCharacters:",
      error
    );
  }
}


async function syncCharacters(button) {
  if (!button) {
    return;
  }

  const initialText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "Synchronisation...";

  try {
    const data = await fetchJson(
      "/api/characters/import/battlenet",
      {
        method: "POST",
      }
    );

    button.textContent =
      `${data.imported} personnage(s) synchronisé(s)`;

    await loadCharacters();

    window.setTimeout(() => {
      button.textContent =
        initialText;
    }, 2000);
  } catch (error) {
    if (
      error.status === 401 &&
      error.data?.login_url
    ) {
      window.location.href =
        error.data.login_url;

      return;
    }

    button.textContent =
      "Erreur de synchronisation";

    console.error(
      "Erreur syncCharacters:",
      error
    );

    window.setTimeout(() => {
      button.textContent =
        initialText;
    }, 2500);
  } finally {
    button.disabled = false;
  }
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


document.addEventListener(
  "DOMContentLoaded",
  () => {
    const syncButton =
      document.querySelector(
        "[data-sync-characters]"
      );

    if (syncButton) {
      syncButton.addEventListener(
        "click",
        () => syncCharacters(syncButton)
      );
    }

    loadCharacters();
  }
);
