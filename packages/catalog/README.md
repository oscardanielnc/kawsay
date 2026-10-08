# @kawsay/catalog

The food catalog the app bundles: INS and USDA source tables, the hand-curated seed, and the importer that joins
them (ADR 0014, 0015).

| Path                                  | Holds                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `sources/`                            | INS 2023 foods and group S, USDA SR Legacy, as CSV; scripts in `scripts/` regenerate them ([README](sources/README.md)) |
| `seed/foods.json`, `seed/dishes.json` | Foods with household units, and seed dishes as recipes in grams                                                         |
| `seed/matches.json`                   | Each seed food → its INS code or USDA FDC id, cooked-to-raw factor, B12/vitamin D filler; seed dishes → group S code    |
| `src/`                                | Importer: resolve foods, dish totals with coverage, group S cross-check, report                                         |
| `dist/catalog.json`                   | Build output (not versioned)                                                                                            |
| `reports/import.md`                   | What a person must review: unmatched foods, labels to read, proxies, conversions, dishes outside ±20%                   |

```sh
pnpm --filter @kawsay/catalog build   # dist/catalog.json + reports/import.md
pnpm --filter @kawsay/catalog test
```

## Rules

- Values are per 100 g **as eaten**. A raw source row for a cooked food is converted with the TAFERA 2016 factor:
  nutrients × factor, water = 100 − (100 − raw water) × factor
- B12 and vitamin D, which INS lacks, come from the linked USDA food (`fill`); plant foods get 0; otherwise unknown
- Unknown stays `null`, never 0; dish totals carry a coverage per nutrient
- A link to a row that does not exist fails the build. The importer never guesses a match
- Fixing a number means editing `seed/` or `matches.json` and rebuilding, never editing the output
