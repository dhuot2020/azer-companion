# Modèle de données — Azer Companion

## Sources

### Battle.net

Source de référence pour l'identité publique du compte et des personnages : nom, royaume, niveau, classe, race, faction et médias.

### Azer Companion Collector

Source locale pour l'activité en jeu : profil observé, métiers, localisation, connexions, déconnexions et sessions.

### Azer Companion Core

Couche de normalisation et de calcul. Le Core ne fabrique aucune donnée; il fusionne les sources, calcule les agrégats et prépare les vues.

## Entités principales

```text
Account
  ├── Characters
  │     ├── BattleNetProfile
  │     ├── CollectorProfile
  │     ├── Sessions
  │     ├── Locations
  │     └── Events (à venir)
  └── DashboardSummary
```

## Character

Clé de rapprochement actuelle : `nom normalisé + royaume normalisé`.

```js
{
  id,
  guid,
  name,
  realm,
  level,
  classId,
  className,
  raceId,
  faction,
  media,
  collector: {
    profile,
    professions,
    location,
    sessions,
    lastSeenAt
  }
}
```

## Session

```js
{
  id,
  startedAt,
  endedAt,
  durationSeconds,
  endReason,
  startLocation,
  endLocation
}
```

## DashboardSummary

```js
{
  characterCount,
  totalLevels,
  sessionCount,
  uniqueZoneCount,
  weekPlaySeconds,
  latestActivityAt,
  latestLocations
}
```

## Règle de vérité

- Valeur connue : affichée.
- Valeur calculable : calculée par le Core.
- Valeur inconnue : `null` et état vide dans l'interface.
- Valeur non collectée : jamais remplacée par une donnée de démonstration.
