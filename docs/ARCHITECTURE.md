# Architecture — OmbreLoup Companion

## 1. Objectif du projet

OmbreLoup Companion est une application personnelle destinée à suivre la progression du personnage OmbreLoup dans World of Warcraft Retail.

L’application doit permettre de suivre progressivement :

- les zones;
- les quêtes;
- les donjons;
- les raids;
- les mascottes;
- les familiers de chasseur;
- les montures;
- les jouets;
- les hauts faits;
- les rares;
- les trésors;
- les transmogrifications;
- les données provenant d’addons comme All The Things, TomTom, RareScanner et Rematch.

Le projet doit rester simple à utiliser, rapide, maintenable et évolutif.

---

## 2. Technologies principales

- Node.js
- Express
- EJS
- JavaScript
- CSS
- SQLite, lorsque la persistance en base de données sera ajoutée
- Git
- GitLab

Aucun framework CSS lourd ne sera utilisé au début.

L’interface sera développée avec du CSS personnalisé afin de conserver un contrôle complet sur le design.

---

## 3. Structure générale

```text
OmbreLoupCompanion/
│
├── index.js
├── package.json
├── package-lock.json
│
├── config/
│   └── appConfig.js
│
├── controllers/
│   ├── dashboardController.js
│   ├── zonesController.js
│   └── dungeonsController.js
│
├── routes/
│   ├── dashboard.js
│   ├── zones.js
│   └── dungeons.js
│
├── services/
│   ├── progressionService.js
│   └── addonImportService.js
│
├── models/
│   ├── zoneModel.js
│   └── dungeonModel.js
│
├── middleware/
│   ├── errorHandler.js
│   └── notFoundHandler.js
│
├── utils/
│   ├── logger.js
│   └── formatters.js
│
├── views/
│   ├── pages/
│   │   ├── dashboard.ejs
│   │   ├── zones.ejs
│   │   └── dungeons.ejs
│   │
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── sidebar.ejs
│   │   ├── topbar.ejs
│   │   └── footer.ejs
│   │
│   └── errors/
│       ├── 404.ejs
│       └── 500.ejs
│
├── public/
│   ├── css/
│   │   ├── app.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── pages/
│   │       ├── dashboard.css
│   │       ├── zones.css
│   │       └── dungeons.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   └── modules/
│   │       ├── navigation.js
│   │       └── progress.js
│   │
│   ├── img/
│   └── icons/
│
├── data/
│   ├── zones.json
│   └── dungeons.json
│
├── database/
│   ├── ombreloup.db
│   └── migrations/
│
├── addons/
│   ├── att/
│   ├── tomtom/
│   ├── rarescanner/
│   └── rematch/
│
├── tests/
│
├── .gitignore
├── README.md
├── CHANGELOG.md
└── ARCHITECTURE.md
```
