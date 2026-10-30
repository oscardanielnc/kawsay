# F24. Refined flours

- Release: proposal
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
- Sixth gauge on Today, one-sided like added sugar (F22): blue · amber · coral
- Default personal ceiling: 50% of the day's carbohydrate target, editable in Profile. Shown as "your limit", never
  as a health threshold
- Sugar is more specific to liver fat than flours (F25); this gauge is about overeating, not the liver
- Insights: weekly "where your calories come from" (rice · bread and cookies · sweets · fruit · other) to show which
  food weighs most

## Acceptance criteria (draft)

- [ ] A juane counts the carbohydrate of its rice as refined flour, not the rest of the dish
- [ ] Changing the personal ceiling moves the gauge zones the same day
