# Alpha 13.3 — Quêtes personnelles vs compte

- Sépare les quêtes terminées propres au personnage des quêtes partagées au niveau du compte.
- Exclut les quêtes de combats de mascottes et les quêtes marquées compte de l’historique personnel.
- Nettoie automatiquement les anciens historiques mélangés au prochain `/azer scan`.
- Ajoute un compteur distinct « Quêtes partagées du compte ».

# Changelog

## Collector 2.0 Alpha 4
- Identification robuste par GUID avec secours nom-royaume.
- Migration automatique des anciennes clés de personnage.
- `/azer status` affiche les personnages réellement enregistrés.
- Nouvelle commande `/azer who` pour diagnostiquer le personnage courant.


## 2.0.0-alpha.2 - Roster Battle.net sécurisé

- Conserve le dernier roster complet connu lorsqu'une réponse Battle.net est temporairement incomplète.
- Fusionne les données fraîches avec les personnages déjà connus sans créer de doublons.
- Sauvegarde locale du roster réel dans le navigateur.
- Les personnages absents d'une synchronisation ponctuelle ne disparaissent plus des cartes.
# Azer Companion - Journal des changements

## Sync 1.0.2 - Visibilite des hauts faits

- Le statut Battle.net affiche maintenant toujours le nombre de hauts faits.
- Lorsque le Collector n'a encore rien enregistre, le statut affiche clairement `0 haut fait`.
- Le total reel remplace automatiquement le zero apres une synchronisation reussie.

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

## Sync 1.0.1 - Moteur central de synchronisation

- Ajout de `POST /api/sync` pour lancer une synchronisation manuelle réelle.
- Ajout du gestionnaire `core/sync/syncManager.js`.
- Ajout d'un résumé du Collector et des hauts faits locaux.
- Rapport de synchronisation avec durée, personnages, médias et disponibilité des données locales.
- Le bouton Synchroniser utilise désormais la route dédiée au lieu de simplement recharger la liste.
- Le statut affiche le nombre de personnages et le nombre de hauts faits disponibles.

## Collector 2.0 Alpha 7 - Diagnostic et lien media canonique
- Le serveur charge d'abord le profil officiel du personnage.
- Le lien `media.href` fourni par Blizzard est prioritaire.
- L'URL reconstruite reste disponible en secours.
- Ajout de `mediaDiagnostic` pour distinguer profil disponible, média 404 et erreur temporaire.

## Collector 2.0 Alpha 11

- Suppression des appels automatiques à `/api/characters` lorsque la session Battle.net est déjà expirée.
- Conservation et affichage du roster local de 7 personnages sans erreur 401 au chargement.
- Journalisation unique des portraits Blizzard indisponibles par personnage.
- Utilisation silencieuse de l'emblème de faction pour Octaviia et Tanakio-Duskwood tant que Blizzard retourne 404.
- Aucune modification des données Collector, des GUID ou des portraits valides.

## 2.0.0-alpha13.2
- Import de l'historique complet via C_QuestLog.GetAllCompletedQuestIDs().
- Stockage par personnage dans quests.completedHistory.
- Chargement progressif des titres via QUEST_DATA_LOAD_RESULT.
- Compteur réel de quêtes terminées connues.
- Pagination de l'historique dans l'interface Web.
- Séparation entre historique importé et nouvelles quêtes observées.
