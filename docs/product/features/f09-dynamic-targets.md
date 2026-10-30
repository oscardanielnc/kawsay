# F09. Dynamic targets

- Release: v0.1
- Status: Approved 2026-10-07

## What

Targets follow the day's activity and the real weight trend.

## Rules

- Formulas and default values: ADR 0009
- Liver-related targets (sugar per portion, sugary drinks, movement, strength days, alcohol, sleep): ADR 0020
- Protein: 1.6 g per kg of reference weight, fixed all day
- Fat: 25% of the day target; carbohydrates take the remainder (warning below 130 g)
- The target never goes below BMR
- A goal that is not a loss gets no deficit: the target is the expenditure (no surplus in v0.1)
- With ≥ 14 days of weights, compare the real trend with the expected one and recalibrate the base, at most ±10% per step
- Only real data counts: the window splits into stretches between weigh-ins, and a stretch with a day without logged meals is left out (its energy and its weight change). A step needs ≥ 7 logged days in counted stretches

## Acceptance criteria

- [x] Logging an activity raises calories, fat and carbohydrates; protein does not change
- [x] Male, 30 y, 170 cm, 80 kg, default activity, −0.5 kg/week → ≈ 1,840 kcal · 116 g protein · 51 g fat · 230 g carbohydrates
