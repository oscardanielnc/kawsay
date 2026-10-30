# Build plan: Amanecer redesign + liver targets (2026-10-30)

Everything the owner approved on 2026-10-30, in the order to build it. **When Oscar says "actualiza el proyecto"
(or "sigue con el plan", "continúa"), run the first milestone below that is not ✅.**

## Milestones

| # | Milestone | Main docs | Status |
| --- | --- | --- | --- |
| [M0](m0-setup.md) | Setup and baseline | this plan | ✅ 2026-10-30 |
| [M1](m1-quick-fixes.md) | Quick fixes: nap, first tap, back, faces, bloating, hydration, symptom episodes | F05 F10 F11 F13 | ✅ 2026-10-30 (first tap: check on the phone) |
| [M2](m2-missing-foods.md) | Missing foods: pending entry, every INS food, refined-flour and drink tags | F23 F24 F22 | ✅ 2026-10-30 (API deploy pending) |
| [M3](m3-design-system.md) | Amanecer design system: tokens, fonts, background, components, motion | design | ✅ 2026-10-30 |
| [M4](m4-today.md) | Today redesigned with six gauges | F05 F10 F22 F24 | ✅ 2026-10-30 |
| [M5](m5-portion-preview.md) | Portion impact preview | F05 ADR 0020 | ✅ 2026-10-30 |
| [M6](m6-liver.md) | Liver targets and Liver card | F25 ADR 0020 F20 F10 F11 F04 F01 | ✅ 2026-10-30 |
| [M7](m7-ai-summary.md) | AI summary only on demand, short, with tags | F17 | ⬜ |
| [M8](m8-other-screens.md) | Every other screen in the new style | direction | ⬜ |
| [M9](m9-release.md) | Release to Oscar's phone | runbooks | ⬜ |

Baseline (M0, 2026-10-30): `pnpm check` green, 628 tests (core 221 · catalog 53 · contracts 6 · api 35 · mobile 313),
19 s uncached. Needs Docker Desktop running (api e2e)

## How to run a milestone

1. `git status`: if there are uncommitted changes you did not make, stop and ask
2. If the previous milestone is waiting for approval, the trigger phrase **is** the approval: merge its branch into
   `main` (`git merge --ff-only`), tick it ✅ with the date, then go on
3. `git switch -c plan/mN-<slug>` from `main`
4. Read the milestone file and every doc it lists. If a doc and this plan disagree, the doc wins; if something is
   unclear about Oscar's data or wishes, ask (his vault is the source: `D:\OSCAR\Documents\Obsidian-Oscar`)
5. Install what it needs, then build in small commits: tests first for every `packages/core` rule, English
   conventional commits, no AI marks, docs in the same commit (criteria `[x]`, build notes, new ADR if a decision)
6. `pnpm check` and `pnpm test` green before the last commit
7. Mark the milestone "⏳ waiting for approval" here and report (below)

## Report to Oscar (Spanish, short, visual)

- ≤ 15 lines: ✅ what changed · 🧪 how to try it on the phone (Kawsay Dev) · ⚠️ anything pending or doubtful
- Teacher mode for each new concept: qué · por qué · cómo funciona por dentro · cómo defenderlo en una entrevista;
  new concepts also become a lesson in the vault (`Knowledge\Lecciones\`, CLAUDE.md)
- Close with: "¿Lo apruebas? Di «actualiza el proyecto» para aprobar y seguir, o dime qué cambiar."

## Stop and ask first (never on your own)

- A new native module or anything that needs a new APK (ADR 0010, `src/native-manifest.test.ts`)
- Deploying the API (`deploy/deploy.sh`, dev or prod) or publishing an EAS Update (`release` script)
- A database migration that rewrites or deletes existing rows (adding tables or nullable columns is fine)
- `git push`, changing repo visibility, or anything that sends health data off the phone in a new way
- Spending money or creating accounts

## Always

- Try things on **Kawsay Dev** with invented data, never on the real account. Oscar's health data never goes into
  docs, fixtures, tests or commits
- Order when contracts change: deploy the API first (it keeps answering the old app), then the app update
- Design source of truth: [design/explorations/2026-10-30-amanecer](../design/explorations/2026-10-30-amanecer/README.md)
