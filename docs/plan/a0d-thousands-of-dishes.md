# A0d. Thousands of dishes (owner, 2026-11-02)

Goal: at least 2,000 dishes to pick from, new ones without app updates, and "Crear con IA" for anything missing
(ADR 0028, F23 pieces 4–6, F07 v0.2). The owner's examples: torta helada, tequeños, arroz árabe.

## Read

- ADR 0008, 0014, 0018, 0021, 0028; F06, F07, F22, F23, F24; `packages/catalog` (seed, build, tags, added sugar);
  the API catalog module; sync on both sides

## Already done (planning chat, 2026-11-02)

- `packages/catalog/scripts/build_ins_dishes.py` + its output `seed/generated/ins-dishes.json` (**544 official INS
  group S dishes**, e.g. tequeños, arroz árabe con pollo, arroz con leche) and `reports/ins-dishes.md`. Re-run it
  with `python scripts/build_ins_dishes.py` from `packages/catalog` to check it reproduces the file

## Steps

0. **Wire layer 1:** `build-catalog` reads `seed/generated/ins-dishes.json` as dishes with direct per-100 g
   nutrients (no ingredients), serving grams and label, `source: INS-S`; added sugar and refined-flour values from
   the file; the drink tag for group `drink`. Tests: count, a sample dish, F22 criterion 4 still true, search finds
   "tequeños" and "arroz árabe". The phone shows "Fuente: INS (preparaciones)" in the detail
1. **Dish list** (`packages/catalog/scripts`): the categories of ADR 0028, enough names to pass 2,000 dishes in total,
   with aliases, deduplicated against the curated and the INS dishes; saved as `seed/generated/dish-names.json`.
   INS has almost no desserts or bakery: start there (torta helada, keke, alfajores, picarones, suspiro a la limeña,
   turrón, panetón, tres leches, pie de limón, chocotejas…), then fast food, international and street food
2. **Recipes**, batch, resumable, cached on disk: Gemini free tier (`GEMINI_API_KEY`), `deepseek-flash` as fallback.
   Output validated with Zod: catalog ids, grams, servings, household unit, icon; no nutrients
3. **Checks and report** `packages/catalog/reports/generated-dishes.md`: ranges per category, macros, duplicates, one
   corrected retry, failures left out; added sugar and tags inherited from the ingredients
4. **Catalog by sync** (F23 piece 5): API endpoint with catalog versions and deltas; the phone pulls them into SQLite
   at start and on pull-to-refresh. Search order: curated, then generated ("Receta estimada"), then generic INS foods
5. **"Crear «…» con IA"** (F07 v0.2, F23 piece 4): from an empty search, the portion step and, later, the text
   agent's unmatched items (A1). One AI call, the table computes, the user edits and saves
6. **Tests:** generator validation with fixtures, delta sync, search order, AI dish with a fake model

## Done when

- [x] F23 criteria of pieces 4–6 pass; the build report is committed; the AI spend goes in the final report
