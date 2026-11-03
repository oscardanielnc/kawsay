# Kawsay

Mobile journal for food, activity, body and mood. Daily nutrition targets follow the day you actually had, and the
app shows which foods and habits line up with how your gut, energy and mood feel. Peruvian food first: the catalog
comes from the INS 2023 composition tables, with household units.

Status: in daily use by its author since October 2026 (Android, offline-first). Not a medical device.

## What it does

- Meals, activities, sleep, weight, waist, quick check-ins and day notes, each in a few taps
- Targets recalculated from the day's activity (ADR 0009) and liver-health gauges: added sugar, sweet drinks,
  movement, alcohol, sleep (ADR 0020)
- Insights computed on the phone; a short AI reading on request, where the AI picks and the table computes (ADR 0008)
- Private by default: intimate entries are locked on the phone and never reach the AI (ADR 0013)

## Layout

| Path                 | What                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `apps/mobile`        | Expo SDK 57 / React Native app, SQLite on the phone, push/pull sync   |
| `apps/api`           | NestJS API (hexagonal modules): identity, sync, insights, AI gateway  |
| `packages/core`      | Pure TypeScript rules shared by app and API (targets, BMI, gauges)    |
| `packages/contracts` | Zod request/response contracts shared by app and API                  |
| `packages/catalog`   | Food catalog build: INS 2023 and USDA sources, importer and reports   |
| `packages/config`    | Shared TypeScript, ESLint and Prettier config                         |
| `docs/`              | Vision, features, architecture, ADRs, plans ([index](docs/README.md)) |

## Run

```sh
pnpm install
pnpm test                              # every package's tests
pnpm check                             # lint, typecheck, test, build (the CI gate)
pnpm --filter @kawsay/mobile start     # Metro for the development build
```

The API needs Docker for its local Postgres: see [conventions](docs/conventions.md#appsapi) and the
[deploy runbook](docs/runbooks/deploy.md).
