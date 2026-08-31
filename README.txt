PACK 26 V3 - FRONTEND COLLECTOR CLOUD

Ce correctif ajoute la partie JavaScript manquante du Pack 26.

Remplacer uniquement :
- public/js/app.js
- views/partials/footer.ejs

Le HTML du bouton et la route collectorCloud sont deja installes dans ton projet.

Test :
1. npm run dev
2. Ouvrir Quetes
3. Cliquer Importer Collector
4. Choisir AzerCompanionCollector.lua
5. Le bouton doit passer a Import..., puis afficher le nombre de personnages importes.
6. /api/quests doit ensuite retourner available:true.
