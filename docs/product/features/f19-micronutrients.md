# F19. Vitamins, minerals and fibre

- Release: v0.1 (brought forward 2026-10-12)
- Status: Approved 2026-10-07 · prototype: design/explorations/2026-10-07-dish-insights-routine.html

## What

Weekly view of how much fibre, vitamins and minerals the logged food provides against reference intakes, and which
foods supply each one.

## Where

Insights tab, "Vitaminas y minerales" card. Not on Today: one day says nothing.

## References (adults 19–50)

| Nutrient | Man | Woman | Basis |
| --- | --- | --- | --- |
| Fibre | 14 g per 1,000 kcal of the day's target | same | NAM AI |
| Iron | 8 mg | 18 mg | NAM RDA |
| Zinc | 11 mg | 8 mg | NAM RDA |
| Calcium | 1,000 mg | 1,000 mg | NAM RDA |
| Potassium | 3,400 mg | 2,600 mg | NAM AI (2019) |
| Vitamin A | 900 µg | 700 µg | NAM RDA |
| Vitamin C | 90 mg | 75 mg | NAM RDA |
| Thiamine (B1) | 1.2 mg | 1.1 mg | NAM RDA |
| Riboflavin (B2) | 1.3 mg | 1.1 mg | NAM RDA |
| Niacin (B3) | 16 mg | 14 mg | NAM RDA |
| Folate | 400 µg | 400 µg | NAM RDA |
| Vitamin B12 | 2.4 µg | 2.4 µg | NAM RDA |
| Sodium (upper limit) | 2,000 mg | 2,000 mg | WHO |

Other ages: full DRI table in `packages/core`, versioned. Pregnancy and lactation are not supported.

## Rules

- Window: last 7 days, averaged over days with at least 2 meals logged; needs 4 such days, otherwise
  "Registra 4 días para ver tu semana"
- % = average intake ÷ reference. Green ≥ 100 · yellow 70–99 · red < 70. Sodium: green ≤ 2,000 mg ·
  yellow 2,001–2,300 · red > 2,300
- Reds first
- Coverage = share of logged grams with a value for that nutrient. Below 80%: grey bar "datos incompletos", no colour
- Tap a nutrient → its top 3 sources this week + the 5 catalog foods richest in it per usual portion, preferring
  foods the user already logs
- ⓘ caveats: INS vitamin A is in retinol equivalents (may overstate plant sources up to 2×); folate is reported as
  folic acid; iron from plants is absorbed less than from meat, and vitamin C in the same meal helps
- Always shows: "Estima lo que comes, no lo que hay en tu sangre. Eso solo lo mide un análisis."
- Never: supplements, brands, products or diagnoses
- Vitamin D is left out: food is a minor source and the data is sparse

## Acceptance criteria

- [x] A week averaging 6 mg of iron for a 25-year-old man shows 75% in yellow
- [x] A food without iron data lowers the coverage instead of counting as 0
- [x] With 3 logged days the card asks for 4
- [x] 2,500 mg of sodium shows red
- [x] Changing the day's calorie target changes the fibre reference
