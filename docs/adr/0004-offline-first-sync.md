# 0004. Offline-first: SQLite on device, push/pull sync

- Status: Accepted
- Date: 2026-10-07

## Context

Entries happen anywhere (street, market, bed). Waiting for the network breaks the 10-second rule.

## Options considered

- Online-only API calls: fails without signal
- Sync products (PowerSync, ElectricSQL, WatermelonDB): powerful, more infrastructure or lock-in
- **Own protocol over SQLite**: small, explainable, enough for one user per account

## Decision

- Device DB: `expo-sqlite` + Drizzle ORM (bundled migrations, live queries)
- Every record: client-generated UUIDv7 `id`, `updatedAt`, `deletedAt` (tombstone)
- **Push:** changed records since last push → API upserts if `updatedAt` is newer (last write wins per record)
- **Pull:** API returns records changed since the client cursor (server sequence number)
- Sync runs on app open, on reconnect and after writes (debounced)

## Consequences

- Concurrent edits of the same record on two devices: the latest wins; acceptable for personal data
- Server keeps tombstones; purge policy decided before public release
