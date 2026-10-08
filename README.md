# Kawsay

Mobile journal for food, activity, body and mood. Daily nutrition targets follow the day you actually had,
and the app shows which foods and habits line up with how your gut, energy and mood feel.

Status: design closed (2026-10-07); construction starts. Not a medical device.

## Layout

| Path                 | What                                                           |
| -------------------- | -------------------------------------------------------------- |
| `apps/mobile`        | Expo / React Native app (Android first), offline-first         |
| `apps/api`           | NestJS API: sync, food catalog, insights, AI gateway           |
| `packages/core`      | Pure TypeScript rules shared by app and API                    |
| `packages/contracts` | Zod request/response contracts                                 |
| `packages/ui`        | React Native design system with Storybook                      |
| `packages/config`    | Shared TypeScript and lint config                              |
| `packages/catalog`   | Food catalog seed and importer (ADR 0014)                      |
| `docs/`              | Vision, features, architecture, ADRs ([index](docs/README.md)) |

`packages/config`, `packages/core` and `packages/catalog/seed` exist; the rest is planned.

## Run

```sh
pnpm install
pnpm test     # all tests
pnpm check    # lint, typecheck, test, build
```
