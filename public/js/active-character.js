async function setActiveCharacter(characterId) {
  const response = await fetch("/api/characters/active", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ character_id: characterId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Impossible de sélectionner ce personnage.");
  }

  document.querySelectorAll("[data-character-id]").forEach((element) => {
    element.classList.toggle(
      "is-active",
      String(element.dataset.characterId) === String(data.character.id),
    );
  });

  document.dispatchEvent(new CustomEvent("azer:active-character-changed", {
    detail: data.character,
  }));

  return data.character;
}

async function loadActiveCharacter() {
  const response = await fetch("/api/characters/active", {
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const character = data.character;

  document.querySelectorAll("[data-character-id]").forEach((element) => {
    element.classList.toggle(
      "is-active",
      character && String(element.dataset.characterId) === String(character.id),
    );
  });

  return character;
}

document.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-character-id]");
  if (!card) return;

  try {
    await setActiveCharacter(card.dataset.characterId);
  } catch (error) {
    console.error("Erreur sélection personnage :", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadActiveCharacter().catch(console.error);
});
