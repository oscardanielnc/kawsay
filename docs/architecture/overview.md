# Architecture overview

- Status: Approved 2026-10-07

## Map

```
 ┌──────────────── apps/mobile (Expo) ─────────────────┐        ┌──────────── apps/api (NestJS) ────────────┐
 │ features/*  ── screens, hooks                        │        │ modules/*  (hexagonal)                    │
 │      │                                               │  HTTPS │   auth · profile · journal · sync         │
 │      ▼                                               │ ─────► │   catalog · insights · ai                 │
 │ local DB: SQLite + Drizzle  (source of truth)        │  /v1   │        │                                  │
 │      │                                               │        │        ▼                                  │
 │ sync engine: push changes / pull since cursor        │        │ Postgres (Prisma)                         │
 └──────────────────────────────────────────────────────┘        └────────┬──────────────────────────────────┘
          ▲  same rules                                                    │ AiPort
          └──────── packages/core (pure TS) ───────────────────────────────┤
                    BMR · MET kcal · targets · trend · day colour          ▼
                                                                    DeepSeek (OpenAI-compatible API)
```

## Packages

| Package | Holds | Depends on |
| --- | --- | --- |
| `packages/core` | Pure functions and value objects: BMR, MET → kcal, targets, weight trend, recalibration, day colour | nothing |
| `packages/catalog` | Versioned seed data: INS/USDA foods, household units, seed dishes (ADR 0014) | nothing |
| `packages/contracts` | Zod schemas for every API request/response and sync payload | `core` (types only) |
| `packages/ui` | React Native components + Storybook | nothing app-specific |
| `apps/mobile` | Feature folders, local DB, sync engine, i18n | `core`, `contracts`, `ui` |
| `apps/api` | Hexagonal modules, Prisma, AI gateway | `core`, `contracts` |

**Why `core`:** targets and day colours must work offline, so the phone computes them. The API computes the same
values for insights. One implementation, tested once, imported by both.

## API modules

| Module | Responsibility |
| --- | --- |
| `auth` | Accounts, sessions, refresh rotation (ADR 0005) |
| `profile` | Body data, goal, protein/fat parameters |
| `journal` | All dated entries: weight, waist, meals, activities, check-ins, sleep, intimate, custom symptoms |
| `sync` | Push / pull protocol and cursors (ADR 0004) |
| `catalog` | Foods (INS/CENAN, USDA), dishes, activity METs (ADR 0008) |
| `insights` | Day-level aggregation and with/without comparisons (F17) |
| `ai` | `AiPort` + DeepSeek adapter; prompts and output schemas (ADR 0007) |

## Main flows

1. **Log an entry:** screen → local DB write (instant) → sync engine pushes later
2. **Targets:** local entries → `core.computeDayTargets()` → screen. No network
3. **Custom dish (v0.2):** text → existing dishes searched first → API `ai` proposes ingredients + amounts → matched to `catalog` foods, which compute nutrients → user edits and confirms → saved locally (ADR 0014)
4. **Insights (later):** API aggregates the user's days → `insights` compares → `ai` receives aggregates only → findings
5. **Export:** device reads its local DB → JSON + CSV + README → share sheet

## Dependency rules

- `core` imports nothing; enforced by lint
- API: hexagonal layers as in the standard; Prisma only inside `infrastructure/`
- Mobile: `features/*` never import each other; shared code lives in `components/`, `lib/` or packages
- Intimate entries never reach the `ai` module: enforced in the use case and covered by a test
