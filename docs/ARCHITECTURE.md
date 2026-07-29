# Architecture — Azer Companion

## Objectif

Azer Companion est une application personnelle pour World of Warcraft Retail.
Elle connecte un compte Battle.net, présente ses personnages et servira de base
au suivi de leur aventure, de leurs collections et de leur progression.

## Technologies

- Node.js et Express;
- EJS pour le rendu serveur;
- JavaScript natif dans le navigateur;
- CSS personnalisé;
- OAuth Battle.net et API WoW Profile;
- `express-session` pour conserver temporairement le jeton OAuth.

## Flux Battle.net

1. `GET /auth/blizzard` démarre l’autorisation OAuth.
2. `GET /auth/blizzard/callback` vérifie l’état OAuth et stocke le jeton dans la
   session.
3. `GET /api/characters` charge les personnages du compte.
4. Le serveur enrichit chaque personnage avec son média Blizzard.
5. `public/js/app.js` normalise les données et met à jour le Hall, la fiche du
   héros, le tableau de bord et la barre latérale.

L’API de profil ne fournit pas de manière fiable le personnage actuellement
connecté dans le jeu. L’application mémorise donc le héros choisi par
`nom + royaume` dans le stockage local du navigateur.

## Flux Azer Companion Collector

1. L’addon silencieux collecte l’identité, les sessions et la dernière
   localisation connue du personnage.
2. World of Warcraft écrit `AzerCompanionCollector.lua` lors d’un `/reload` ou
   d’une déconnexion.
3. `services/azerCollector.js` analyse ce sous-ensemble Lua sans exécuter le
   fichier.
4. `GET /api/collector` expose uniquement un résumé normalisé, sans révéler le
   chemin du compte local.
5. La barre latérale associe les données au personnage Battle.net par
   `nom + royaume`.

## Organisation actuelle

```text
AzerCompanionV2/
├── index.js
├── routes/
│   └── carnet.js
├── views/
│   ├── carnet.ejs
│   ├── components/
│   └── partials/
├── public/
│   ├── assets/
│   ├── css/
│   └── js/
└── docs/
```

## Limites connues

- Les cartes du carnet d’aventure contiennent encore des données de maquette.
- Les personnages d’aperçu du Hall sont locaux et clairement séparés des
  personnages Battle.net.
- Les sessions utilisent actuellement le stockage mémoire d’Express, adapté au
  développement local mais pas à un déploiement de production.
- La logique du navigateur est encore regroupée dans `public/js/app.js`; elle
  pourra être séparée par vue dans une prochaine branche.
