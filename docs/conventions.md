# Conventions

What the linter cannot enforce. Tooling versions: ADR 0012.

## Commands

| Command | Does |
| --- | --- |
| `pnpm install` | Install every workspace (Node 24, pnpm 12) |
| `pnpm test` | Run every package's tests through Turborepo |
| `pnpm check` | lint → typecheck → test → build, the same gate as CI |
| `pnpm --filter @kawsay/core test:watch` | TDD loop on `core` |
| `pnpm --filter @kawsay/mobile start` | Metro for the development build ([apps/mobile](../apps/mobile/README.md)) |
| `pnpm --filter @kawsay/catalog build` | Rebuild the food catalog and its import report |

## Repository

- Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`), scope = package or app: `feat(core): …`
- Hooks: `pre-commit` runs gitleaks and lint-staged; `commit-msg` strips AI trailers
- CI (`.github/workflows/ci.yml`): gitleaks over the full history, then `pnpm check`'s steps; a red run blocks the merge
- Docs change in the same commit as the code they describe

## apps/mobile

- Tests query by role and visible text, never by test IDs or internal state; RNTL 14 APIs are async (`await render`)
- The clock and the time zone reach screens as props from the route, so tests fix them
- Colors and sizes come from `docs/design/tokens.md` until `packages/ui` exists

## packages/core

- Pure functions, no imports outside the package (lint rule in `eslint.config.mjs`)
- One file per rule, test next to it: `bmr.ts` + `bmr.test.ts`. No barrel files: consumers import
  `@kawsay/core/<folder>/<file>`
- Units in names: `weightKg`, `heightCm`, `hours`, `kcal`. Numbers stay unrounded unless a rule classifies on a
  rounded value (BMI, waist-to-height); rounding for display belongs to the screen
- Labels are codes (`overweight`, `increased`), never Spanish text: the app translates them (ADR 0006)
- Tests come from the feature acceptance criteria; a criterion's example appears verbatim in a test name
