# F10. Quick check-ins

- Release: v0.1
- Status: Approved 2026-10-07

## What

Body and mood in one or two taps.

## Rules

- Bathroom: Bristol 1–7 drawings + "gas only"
- ~~Bloating relative to your normal~~ **removed 2026-10-30** (owner: not objective). Past entries stay in history and export; the day no longer asks
- **Highest stress felt today** (the peak), energy and mood as **five faces without background**, each with its own colour and shape (crying red → beaming yellow). **The most negative face is always on the left**, stress included (owner, 2026-10-30)
- **Hydration is an optional module, collapsed by default** (owner, 2026-10-30): urine colour always visible; drinks open on tap. Its "day logged" step is the urine colour (confirmed by the owner, 2026-10-30)
- Hydration: water and zero-calorie drinks are tapped here as approximate glasses (≈ 250 ml). Drinks with calories logged in meals appear here automatically with their meal marked. Tapping a caloric drink here (soft drink, juice, energy drink) creates its food entry in the current meal, so calories are never lost or doubled. Alcohol is logged but not counted toward the goal. **Each alcoholic drink has a kind and a volume** (owner,
  2026-10-30; ADR 0020): beer 330 ml at 5% (big bottle 620 ml) · wine 150 ml at 12% · pisco or other spirit 45 ml at
  42% / 40% · cocktail 60 ml of spirit; volume and % editable per drink. Grams = ml × % ÷ 100 × 0.789, shown in the
  Liver card (F25). Older entries without a kind read "sin dato" until edited. Urine colour (clear / yellow / dark)
- Daily drinks goal = 80% of the EFSA total water intake (men 2.5 L, women 2.0 L) in glasses, rounded up (men 8, women 7) + climate extra from the profile (warm +2, temperate and cold 0) + 2 glasses with "I sweated a lot today". Water from food is not tracked
- Bathroom also offers "didn't go today"
- Every check-in stores its time

## Acceptance criteria

- [x] Any check-in takes at most two taps
- [x] A 620 ml beer at 5% logs 24.5 g of alcohol

## Build notes

- 2026-10-30: faces follow the Amanecer component spec (grey `face-off` until picked, then their colour at 1.14).
  Stress keeps its stored values (1 none … 5 highest) and is only drawn from 5 to 1. The day checklist's "water"
  step is the urine colour alone; "body" needs the bathroom plus stress, energy and mood
