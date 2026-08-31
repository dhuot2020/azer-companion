AZER COMPAGNION - FIX PERSONNAGE ACTIF V3

Le frontend utilisait encore localStorage comme source de verite pour le heros selectionne.
Cela pouvait afficher Héros sélectionné alors que /api/characters/active retournait null.

Correction:
- /api/characters/active devient la source de verite.
- un POST reussi met a jour serverActiveCharacterId.
- localStorage sert seulement de preference d affichage de secours.

Remplacer public/js/app.js puis redemarrer npm run dev.
Reconnecter Battle.net si necessaire, ouvrir Hall des heros, la fiche, puis Choisir ce heros.
