# Azer Companion Collector 2.0 alpha 1

Première fondation modulaire du Collector 2.0.

## Installation

Copier le dossier `AzerCompanionCollector` dans :

`World of Warcraft/_retail_/Interface/AddOns/`

Puis redémarrer WoW ou utiliser `/reload`.

## Commandes

- `/azer scan` : analyse le personnage, les hauts faits et les quêtes actives.
- `/azer status` : affiche un résumé du dernier scan.
- `/azer export` : marque les données comme prêtes et demande un `/reload` ou une déconnexion.

## Données couvertes dans cette première étape

- Profil du personnage, spécialisation, niveau d'objet, argent, position et métiers.
- Équipement détaillé : statistiques, armure, effets natifs du tooltip, niveau requis, durabilité et prix de vente.
- Catalogue complet des hauts faits visible par l'API WoW, avec complétion, date et attribution au personnage lorsque WoW fournit `wasEarnedByMe`.
- Quêtes actives et leurs objectifs.
- Nouvelles quêtes terminées observées à partir de l'installation de cette version.

## Limite importante sur l'historique des quêtes

WoW ne fournit pas une liste directe de toutes les anciennes quêtes terminées. Pour reconstruire l'historique complet, Azer Companion devra embarquer ultérieurement un catalogue d'identifiants de quêtes, puis vérifier chaque identifiant avec l'API de complétion. Cette alpha installe l'architecture nécessaire sans prétendre inventer les données manquantes.

## Compatibilité

La base existante `AzerCompanionDB` est conservée et migrée vers `schemaVersion = 3` sans supprimer les personnages déjà collectés.


## Alpha 10 - Diagnostic du 7e personnage

- `/azer verify` confirme que le personnage courant existe dans AzerCompanionDB.
- `/azer diag` affiche la dernière écriture persistante tentée.
- Le scan vérifie le personnage au début, dans le module Character et à la fin.

## Module Quêtes - Alpha 13
1. Connectez le personnage dans WoW.
2. Lancez `/azer scan`.
3. Faites `/reload` pour écrire les SavedVariables.
4. Dans Azer Companion, ouvrez le menu **Quêtes** puis cliquez sur **Actualiser**.

Le Collector importe les quêtes actives et leurs objectifs. L'historique complet antérieur à l'installation n'est pas toujours exposé par l'API WoW; les nouvelles quêtes terminées sont enregistrées avec le personnage et la date.


## Alpha 3 - Progression de classe Chasseur

Le module Quêtes capture maintenant les déblocages spéciaux d'apprivoisement du Chasseur.
Les déblocages basés sur un flag de quête utilisent `C_QuestLog.IsQuestFlaggedCompleted`; ceux basés sur une connaissance utilisent l'API de sorts disponible dans le client.
Les résultats sont écrits dans `character.classProgress.hunter.taming` et restent explicitement `supported = false` si l'API n'est pas disponible.


### Chasseur - Bestiaire spécial (alpha4)
Le module `HunterPets.lua` lit les familiers actifs et l'écurie via `C_StableInfo`. Azer Companion conserve le `creatureID`, le nom, la famille, le niveau, l'icône et la source (actif/écurie). Le site compare ensuite les `creatureID` observés à son catalogue de bêtes rares/spéciales. Une bête n'est marquée **Apprivoisée** que si elle est réellement présente dans les données du Collector.
