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

## Implemented foundation
- Battle.net OAuth is bound to an internal `app_users.id`.
- OAuth tokens are encrypted in PostgreSQL and never stored in the browser session.
- Express sessions are persisted in `app_http_sessions`, so restarts and multiple Node instances share authentication state.
- Session identifiers are regenerated after OAuth login.
- Character lists, active-character preferences and character API calls are scoped by `user_character_access`.
- Browser roster and active-character caches are namespaced by internal user ID.
- The local Collector is disabled by default in production and filtered against the authenticated user's roster in development. Without `LOCAL_COLLECTOR_USER_ID`, it is available only while the database has a single active user.

## Deployment requirement
Run `npm run db:migrate` before starting a new application version. Migration `025_postgresql_http_sessions` is required by the PostgreSQL session store.

## Next implementation step
Replace the development-only SavedVariables reader with an authenticated Sync client and persist Collector snapshots by `user_id` and `device_id`.
