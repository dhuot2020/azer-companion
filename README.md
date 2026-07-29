# Azer Companion

Azer Companion est une application Node.js consacrée à World of Warcraft. Elle
connecte un compte Battle.net, affiche ses personnages Retail et propose un
Hall des héros ainsi qu’un carnet d’aventure.

## Installation

```bash
npm install
```

Créer un fichier `.env` contenant :

```dotenv
BLIZZARD_CLIENT_ID=
BLIZZARD_CLIENT_SECRET=
BLIZZARD_REDIRECT_URI=http://localhost:3030/auth/blizzard/callback
BLIZZARD_REGION=us
BLIZZARD_LOCALE=fr_FR
SESSION_SECRET=
PORT=3030
WOW_INSTALL_PATH=C:\Program Files (x86)\World of Warcraft
```

`WOW_INSTALL_PATH` est facultatif lorsque World of Warcraft est installé dans
le dossier Windows par défaut. L’application y recherche en lecture seule les
données produites par Azer Companion Collector.

## Démarrage

```bash
npm start
```

L’application est ensuite disponible sur `http://localhost:3030`.

Pour le développement avec redémarrage automatique :

```bash
npm run dev
```

## Structure actuelle

- `index.js` : démarrage d’Express et sessions;
- `routes/carnet.js` : OAuth et API Battle.net;
- `views/carnet.ejs` : carnet, Hall des héros et fiche du héros;
- `public/js/app.js` : interactions et rendu des personnages;
- `public/css/` : styles organisés par composants et mises en page.
- `services/azerCollector.js` : import sécurisé des données locales du
  collecteur;
- `wow-addon/AzerCompanionCollector/` : source de l’addon silencieux installé
  dans World of Warcraft.

Les personnages de démonstration du Hall sont uniquement des aperçus visuels.
Les informations d’un personnage réel proviennent de l’API Battle.net.
