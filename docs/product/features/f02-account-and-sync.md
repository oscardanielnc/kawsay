# F02. Account and sync

- Release: v0.1
- Status: Approved 2026-10-07

## What

Sign in once; every entry is stored on the device first and synced when online.

## Rules

- The app works fully offline
- Records are identified by client-generated ids; the last edit wins per record
- Deletes are soft (tombstones) so they sync

## Acceptance criteria

- [ ] Entries made in airplane mode appear on the server after reconnecting, without duplicates
- [ ] Editing the same entry on two devices keeps the most recent edit
