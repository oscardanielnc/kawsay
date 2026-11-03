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
- One-sided gauge at real scale (ADR 0027, 2026-11-01): 0–15% of the target kcal in thirds (blue · amber · coral);
  the needle stops at the end past 15%
- Redesign 2026-10-30: same rule, zones blue · amber · coral. The owner asked where it went: it was missing from the
  first mockup, not removed
- **Liver emphasis (owner, 2026-10-30; ADR 0020):** a portion that adds more than 10 g shows an amber chip "Mucho
  azúcar para una comida" in the portion preview (F05) · the gauge's detail sheet shows today's top sugar source and
  the week's **sugary drinks** (a drink with ≥ 5 g of added sugar; 0 blue · 1–2 amber · ≥ 3 coral) · the Liver card
  (F25) opens with the week's daily average

## Acceptance criteria

- [x] With a 2,000 kcal target the green limit is 25 g and the yellow limit 50 g
- [x] A personal Coca-Cola (500 ml) adds 55 g of added sugar
- [x] A papaya or a glass of milk adds no added sugar
- [x] Every packaged or prepared food of the catalog has an explicit added-sugar value
- [x] A personal Coca-Cola shows "Mucho azúcar para una comida" before adding it and counts as one sugary drink
- [x] A drink with 4 g of added sugar is not a sugary drink; one with 8 g is

## Build notes

- 2026-11-03 (A0b): the gauge takes its zones from `@kawsay/core/gauge/scale` (`oneSidedScale`): 0–15% of the
  target kcal in thirds; Today and the portion preview draw the same arcs
