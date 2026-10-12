# F22. Added sugar

- Release: v0.1
- Status: Approved 2026-10-12 (requested by Oscar)

## What

A fifth gauge on Today: grams of added sugar eaten, against a ceiling that follows the user's own calorie target.

## Rules

- Counts **free sugars** (WHO 2015): sugar added by the cook or the maker (table sugar, sweetened condensed milk,
  manjar blanco, sugars on a package label) and the sugar of squeezed fruit juice. Sugar inside whole fruit and milk
  does not count
- The INS 2023 table has no sugar column, so each food gets an explicit added-sugar value per 100 g in
  `packages/catalog/seed/added-sugar.json`; label foods take it from the label (added sugars, else total sugars).
  Foods not listed have none
- Ceiling from the day target: green up to 5% of the target kcal, yellow up to 10%, red above (1 g = 4 kcal)
- One-sided gauge: green 3 · yellow 2 · red 2 sevenths; the needle stops at the end past 15%

## Acceptance criteria

- [x] With a 2,000 kcal target the green limit is 25 g and the yellow limit 50 g
- [x] A personal Coca-Cola (500 ml) adds 55 g of added sugar
- [x] A papaya or a glass of milk adds no added sugar
- [x] Every packaged or prepared food of the catalog has an explicit added-sugar value
