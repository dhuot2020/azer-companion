
## Collector 2.1.0-alpha1

- Sélection moderne et restaurée de la quête avant lecture des détails.
- Capture renforcée de la description, du résumé et du texte de complétion.
- Capture XP, argent, objets garantis, choix, monnaies et sort appris.
- Compatibilité avec les signatures modernes et anciennes des API du journal.

## Sprint 1.1 - Alpha 13.6

- Séparation des quêtes actives personnelles et Bande de guerre.
- Détection des quêtes actives de compte explicites ou présentes sur plusieurs personnages.
- Electria peut maintenant servir de personnage témoin : aucune quête personnelle n’est affichée si elle n’a rien accepté.
- La vue Compte affiche les quêtes actives partagées et leurs objectifs.
- Migration automatique des anciennes données `active` vers `activeRaw`.
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

## Sprint 1.1 - Alpha 13.5 - Quetes Compte / Personnage

- Ajout de `Compte - Bande de guerre` au bas du selecteur des quetes.
- Separation des quetes partagees du compte et de l'historique personnel.
- Regroupement des quetes explicitement marquees compte par WoW.
- Detection prudente des anciennes quetes partagees presentes sur plusieurs personnages.
- Protection des quetes reellement observees par le Collector afin de les conserver dans l'historique personnel.
- Compteurs et titres adaptes selon la vue Compte ou Personnage.
- Migration compatible avec les SavedVariables existantes.

## Sprint 1.1 - Alpha 13.7 - Quest Details Engine

- Ajout d'un panneau latéral de détails au clic sur une quête active.
- Détails accessibles aussi depuis l'historique et les quêtes observées.
- Affichage du type, de la zone, du niveau, du groupe conseillé, des objectifs et des QuestID.
- Navigation clavier (Entrée/Espace) et fermeture avec Échap.
- Structure prête pour brancher descriptions et récompenses complètes à l'étape suivante.

## Sprint 1.1 - Alpha 13.8 - Description et recompenses

- Suppression du libelle technique `Quest Details Engine` dans le panneau joueur.
- Collecte de la description et du texte general des objectifs pour les quetes actives.
- Collecte de l'experience, de l'argent, des objets garantis et des objets au choix.
- Affichage visuel des recompenses avec symboles XP, monnaies et qualite des objets.
- Messages discrets lorsque WoW ne fournit pas une description ou une recompense detaillee.

## Sprint 1.1 - Alpha 13.9 - Quest Database Engine

- Ajout d'une base locale `public/data/quests/quest-database.json` indexée par QuestID.
- Enrichissement automatique des quêtes lorsque le Collector ne fournit pas la description, la zone ou les récompenses.
- Les données vivantes du Collector restent prioritaires pour la progression et les objectifs.
- Ajout d'un indicateur discret `Base Azer Companion` dans le panneau de détails.
- Première fiche enrichie : `Se présenter au comptoir` (#76105), à partir des informations validées en jeu.

## Sprint 1.1 - Alpha 13.9 - Quest Database Engine

- Ajout d'une base locale `public/data/quests/quest-database.json` indexée par QuestID.
- Enrichissement automatique des quêtes lorsque le Collector ne fournit pas la description, la zone ou les récompenses.
- Les données vivantes du Collector restent prioritaires pour la progression et les objectifs.
- Ajout d'un indicateur discret `Base Azer Companion` dans le panneau de détails.
- Première fiche enrichie : `Se présenter au comptoir` (#76105), à partir des informations validées en jeu.

## Sprint 1.1 - Alpha 13.10.1
- Correction de la regression qui vidait le journal actif.
- Scan en deux passes : instantane du journal, puis enrichissement.
- Ajout d'un secours avec GetQuestLogTitle pour les clients ou GetInfo est incomplet.
- Conservation du nettoyage des anciennes quetes terminees.

## 2026-08-04 - Hero Armory V2.2 Final
- Le plein corps devient l'affichage par defaut de la fiche du heros.
- Le mode Portrait applique maintenant un vrai cadrage rapproche visage et buste.
- Le cadre historique du heros, ses medaillons et ses cometes sont reutilises au centre de l'armurerie.
- Les informations du haut sont compactees pour donner davantage d'espace au personnage.
- Les emplacements d'equipement sont affiches comme des icones autour du heros.
- Les details des objets apparaissent uniquement au survol ou au focus de leur icone.
- Ajout d'un resolveur d'icones d'objets via l'API Blizzard.
