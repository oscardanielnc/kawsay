# M2. Missing foods and food tags

Goal: never lose a meal log, build any dish offline, and tag foods for the flours and sugary-drink rules.

## Read

- F23 (pieces 1 and 2 only), F24, F22, F06, F07, `docs/product/food-seed.md`
- ADR 0008, 0014, 0015, 0018; `packages/catalog`, `packages/contracts`, mobile `db` and sync code

## Steps

1. **Every INS food as an ingredient (F23 piece 2):** the catalog build emits all INS 2023 foods (not only the curated
   ones) with generic units: g always; taza, cucharada, unidad only where a weight is known. Curated dishes and
   foods keep ranking first; search ignores accents and case
2. **USDA:** include it under "Más resultados" only if the app update grows less than 2 MB compressed; otherwise INS
   only. Record the sizes and the choice in a new ADR (0021)
3. **Added sugar for the new foods (F22):** every INS food that is packaged, sweetened or a sweet needs an explicit
   value in `seed/added-sugar.json` (source noted: label or USDA analogue). Keep F22 criterion 4 true; list doubtful
   foods in the report instead of guessing
4. **Tags (F24, ADR 0020):** `refined-flour` by INS group and name (white rice, white bread, cookies, cakes, pasta,
   crackers, noodles), `drink` for drinks; dishes inherit from ingredients. One seed file per tag, reviewed once;
   show the list in the report
5. **Pending entry (F23 piece 1):** name and portion, saved now, shown as "pendiente"; counts as logged, adds no
   nutrients until completed; completing it recalculates the day. New synced record: contracts schema, drizzle
   migration (new table), outbox triggers, Prisma model and sync on the API (ADR 0018)

## Done when

- [ ] F23 criteria 1–3 and F24 criterion 1 (juane) pass; tests for search ranking and tag inheritance
- [ ] ADR 0021 written; catalog size in the report
- [ ] The API part is ready but **not deployed**: ask before deploying (dev first)

## Notes

Measured by M0 (2026-10-30):

| File | Rows | Size |
| --- | --- | --- |
| `packages/catalog/sources/ins-2023/foods.csv` | 1,125 | 152 KB |
| `packages/catalog/sources/ins-2023/prepared.csv` | — | 138 KB |
| `packages/catalog/sources/usda-sr-legacy/foods.csv` | 7,793 | 1.31 MB |
| `packages/catalog/dist/catalog.json` (v16: 151 foods, 107 dishes) | — | 336 KB |
