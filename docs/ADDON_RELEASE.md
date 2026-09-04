# Publication de Azer Companion Collector

Le site utilise un manifeste de release et la version détectée dans le dernier import Collector pour afficher l'état du bouton **Installer l'addon**.

## États du losange

- Rouge : addon non détecté ou version différente de la version publiée.
- Vert : version détectée identique à la version publiée.
- Orange : vérification en cours.

La version installée est confirmée uniquement après un import du fichier SavedVariables. Un téléchargement seul n'est pas considéré comme une installation réussie.

## Publier une nouvelle version

1. Modifier `## Version:` dans `wow-addon/AzerCompanionCollector/AzerCompanionCollector.toc`.
2. Exécuter `npm run addon:release`.
3. Vérifier les fichiers générés :
   - `public/downloads/AzerCompanionCollector.zip`
   - `public/downloads/AzerCompanionCollector.json`
4. Déployer le projet puis redémarrer PM2.

Le script génère le ZIP avec le bon dossier racine `AzerCompanionCollector/`, calcule le SHA-256 et écrit le manifeste utilisé par le site.

## Après installation côté joueur

1. Installer/remplacer `World of Warcraft/_retail_/Interface/AddOns/AzerCompanionCollector/`.
2. Lancer WoW et exécuter `/azer scan`.
3. Une fois le scan terminé, exécuter `/reload`.
4. Sur Azer Compagnion, cliquer sur **Synchroniser WoW** et choisir `AzerCompanionCollector.lua` dans `WTF/Account/.../SavedVariables/`.
5. La version est enregistrée côté serveur et le losange devient vert si elle correspond à la release publiée.
