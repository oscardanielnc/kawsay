# F24. Refined flours

- Release: v0.1 (gauge 2026-10-30, weekly insight 2026-11-03)
- Status: **Accepted 2026-10-30** on the owner's condition that it costs little: it does. One tag per catalog food,
  set by INS group and name and reviewed once (like `added-sugar.json`); no new data source

## Why

The owner eats a lot of cake, cookies and white rice and wants to see that load apart from total carbohydrates.

Weight follows total calories, which F09 already tracks. These foods matter because they are easy to overeat: in a
controlled trial, an ultra-processed diet led to about 500 kcal more per day than an unprocessed one (Hall et al.,
*Cell Metabolism*, 2019). The 2025–2030 US Dietary Guidelines ask to minimise highly processed refined carbohydrates
but give **no numeric limit**, so any ceiling here is a personal target, never an official one.

## Proposal

- Foods tagged `refined-flour` in the catalog: white rice, white bread, cookies, cakes, pasta, crackers, noodles;
  dishes inherit it from their ingredients
- Measure: grams of carbohydrate coming from tagged foods, computed by the table (ADR 0008)
- Sixth gauge on Today, one-sided like added sugar (F22): blue · amber · coral, at real scale (ADR 0027: 0 to 2.25 ×
  the limit; blue 44.4 · amber 22.2 · coral 33.3 %)
- Default personal ceiling: 50% of the day's carbohydrate target, editable in Profile. Shown as "your limit", never
  as a health threshold
- Sugar is more specific to liver fat than flours (F25); this gauge is about overeating, not the liver
- Insights: weekly "where your calories come from" (rice · bread and cookies · sweets · fruit · other) to show which
  food weighs most

## Acceptance criteria (draft)

- [x] A juane counts the carbohydrate of its rice as refined flour, not the rest of the dish
- [x] Changing the personal ceiling moves the gauge zones the same day
- [x] Three days of arroz con pollo show its rice apart from the chicken in "¿De dónde vienen tus calorías?"

## Build notes

- 2026-10-30: `packages/catalog/seed/tags/refined-flour.json` (100 foods, reviewed list in `reports/import.md`).
  The build adds `refinedFlourCarbsG` per 100 g (= total carbohydrate of a tagged food, 0 otherwise), so dish
  totals and user dishes add it up like any nutrient
- 2026-10-30 (M4): `@kawsay/core/day/refined-flour`: blue up to the limit (default 50% of the carbohydrate target,
  `profile.refinedFlourShare`, 10–100%), amber up to 150% of it, coral above. Sixth gauge "Harinas" on Today
- 2026-11-03 (A0b): zones from `@kawsay/core/gauge/scale` (`oneSidedScale(limit, 1.5 × limit)`): 0 to 2.25 × the
  limit, blue 44.4 · amber 22.2 · coral 33.3 %
- 2026-11-03: weekly insight "¿De dónde vienen tus calorías?" (`@kawsay/core/insights/calorie-sources`, card
  `features/insights/CaloriesCard.tsx`). Buckets: rice and other refined flours (tag), sweets (added sugar ≥ 40% of
  the food's energy; a sugary cookie stays flour), fruit (INS group C), the rest. A dish splits by the energy of its
  ingredients; an INS group S dish (no ingredients) by its refined-flour and added-sugar energy. Needs 3 logged days
