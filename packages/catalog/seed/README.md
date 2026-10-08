# Catalog seed (draft)

Source data for `packages/catalog` (ADR 0014). Written by hand, reviewed once by the product owner; the
importer turns it into the app database.

| File | Holds |
| --- | --- |
| `foods.json` | Foods: Spanish name, source hint (`INS`, `USDA`, `label`, `none`), state (`raw`, `cooked`, `fried`, `as-sold`) and household units in grams |
| `dishes.json` | Seed dishes: one serving each, ingredients as `{ food, grams }`, icon, group, confidence, note |

## Rules for the importer

- Nutrients are never stored here. They come from the INS table (2023 edition), USDA FoodData Central or the
  package label, matched by name; unmatched foods are listed in a report, never guessed
- Grams are **as eaten**. When the matched INS row is raw and the food is cooked, convert with the INS cooked-to-raw
  factors (*Tablas auxiliares para la formulación y evaluación de regímenes alimentarios*, 2016)
- `label` foods with `grams: null` wait for the label to be read (photo or manual entry)
- `agua` has no nutrients; it only adds volume for hydration (F05)
- Where INS group S has the dish, compare totals; a gap above 20% is flagged for review
- Review table for humans: `docs/product/food-seed.md` (generated from these files)
