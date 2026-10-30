# M0. Setup and baseline

Goal: a clean, green starting point and the one new package the redesign needs.

## Read

- `CLAUDE.md`, `docs/README.md`, `docs/conventions.md`, [README.md](README.md) (this plan)
- `docs/design/explorations/2026-10-30-amanecer/README.md`

## Steps

1. Check the tools: `node -v` (24.x), `pnpm -v` (12.x), `git --version`. If one is missing, stop and give Oscar
   **one** command to install it
2. `pnpm install`, then `pnpm check` and `pnpm test`. Write the result in the plan's "Baseline" line (tests passing,
   time). If anything is red before you change a line, stop and report it
3. Add the title font (JavaScript only, ships by EAS Update):
   `pnpm --filter @kawsay/mobile exec expo install @expo-google-fonts/plus-jakarta-sans`
4. `pnpm --filter @kawsay/mobile test`: `native-manifest.test.ts` must stay green (no new native module)
5. Measure the food sources for M2 and write the numbers in M2's "Notes": rows and size of
   `packages/catalog/sources/ins-2023/foods.csv` and of the USDA source, and the size of `dist/catalog.json`

## Done when

- [x] Baseline recorded, everything green
- [x] Plus Jakarta Sans installed, native manifest unchanged
- [x] Source sizes written in M2
