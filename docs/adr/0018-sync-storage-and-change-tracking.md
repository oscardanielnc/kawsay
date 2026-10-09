# 0018. Sync storage on the server, change tracking on the phone

- Status: Accepted
- Date: 2026-10-09

## Context

ADR 0004 fixed the protocol (push newer records, pull since a server cursor, last write wins). Still open: how
the server stores 16 record types, how the phone knows what to push, and what happens when two devices create
"the same" record (one weight per day) with different ids.

## Options considered

- One Postgres table per record type: typed, but every mobile column change becomes two migrations
- A `dirty` flag or an `updatedAt` watermark on the phone: every write path must remember the flag, and a
  watermark breaks when two devices' clocks differ
- **One `sync_record` table (JSONB) + a local outbox filled by SQLite triggers**

## Decision

- Server: `sync_record(user_id, collection, id, data jsonb, updated_at, deleted_at, seq)`. Every record is
  validated with its Zod schema in `packages/contracts` before it is stored; a test checks those schemas against
  the phone's Drizzle tables, so they cannot drift
- `seq` comes from a Postgres sequence. Pushes of one user take an advisory lock, so their `seq` order is their
  commit order and a pull never skips a record that commits late
- Upsert only when the incoming `updatedAt` is newer: a retried push changes nothing (no duplicates)
- Phone: `AFTER INSERT/UPDATE` triggers write `(collection, id)` to `sync_outbox`, except while a pull is being
  applied (`meta.sync.applying`). No feature code knows about sync
- Records with a natural key (one profile, one weight per day, one waist per week, one day status per day):
  when a pulled record collides with a local one, the older one becomes a tombstone and is pushed
- Accounts are created with a CLI; the app signs in and never signs up (one user until a public release)

## Consequences

- Insights (F17) will read JSONB, or project it into typed tables then
- A record type added on the phone needs its contract schema, or the server rejects it (test fails first)
