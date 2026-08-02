# Changelog

## 1.1.0 - Phase 2 en cours

### Ajouté

- Vision officielle du produit dans `docs/VISION.md`.
- Modèle de données initial dans `docs/DATA_MODEL.md`.
- Premier service Core pour les statistiques de l'accueil.
- Premier service Core pour le journal basé sur les sessions.
- Historique complet des sessions exposé par l'API Collector.

### Corrigé

- Le nombre de sessions n'est plus limité artificiellement à la dernière session.
- Les zones peuvent être calculées à partir des positions de début et de fin des sessions.

### Retiré

- Valeurs fictives des réussites, objectifs, donjons, quêtes et lieux.
- Copie de travail `azer_review/` non nécessaire au fonctionnement du projet.

## 1.1.1 - Journal de bord

- Renommage officiel de « Journal d’aventure » vers « Journal de bord ».
- Ajout des événements de session active, connexion, voyage et fin de session.
- Affichage de cinq événements réels sur l’accueil.
- Ajout d’un état vide explicite lorsqu’aucune session n’est disponible.
- Conservation de la session courante dans la réponse normalisée du Collector.


## 1.1.2

- Capture des hauts faits obtenus via le Collector.
- Affichage des trois réussites les plus récentes sur l’accueil.
- Suppression du texte « Une création de DH Studio » dans le footer.
