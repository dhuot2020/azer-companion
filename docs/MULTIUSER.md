# AzerCompagnion MultiUser

## Goal
Move from a single-PC Collector reader to a multi-user service without breaking the existing local development workflow.

## Identity boundary
AzerCompagnion owns an internal `users.id` UUID. Battle.net, WoW characters and future Sync devices are linked to that UUID. Character name, BattleTag and Express session IDs are never primary user identifiers.

## Data flow target
WoW -> AzerCompanionCollector -> SavedVariables -> AzerCompagnion Sync -> HTTPS API -> PostgreSQL -> Web UI.

## Migration rule
The current local Collector reader remains available during migration. Server-side filesystem access is development-only in the final architecture; production player data will arrive through the authenticated Sync API.

## Sprint 1 foundation
- Environment split for development/production.
- Production-safe session cookie settings and mandatory production session secret.
- PostgreSQL schema for users, Battle.net identities, characters, devices, snapshots, sync logs and preferences.
- No UI rewrite.
- No Windows Sync client yet.

## Next implementation step
Add PostgreSQL connection/migration tooling and a PostgreSQL-backed Express session store, then bind the Battle.net OAuth callback to an internal AzerCompagnion user.
