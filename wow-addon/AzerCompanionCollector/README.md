# Azer Companion Collector

Addon World of Warcraft Retail silencieux destiné à Azer Companion.

Il ne crée aucune fenêtre et n’écrit rien dans le canal de discussion. Il
enregistre dans `AzerCompanionDB` :

- l’identité et le profil du personnage;
- les heures de connexion et de déconnexion;
- les 50 dernières sessions;
- la zone, la sous-zone, la carte et les coordonnées;
- l’instance courante;
- les métiers disponibles par l’API du jeu;
- les 50 derniers hauts faits obtenus pendant que le Collector est actif.

World of Warcraft écrit ensuite cette table dans :

```text
WTF\Account\<COMPTE>\SavedVariables\AzerCompanionCollector.lua
```

Les données sont persistées à la déconnexion ou lors d’un `/reload`.
