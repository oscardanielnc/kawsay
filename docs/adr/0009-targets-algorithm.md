# 0009. Daily targets and recalibration

- Status: Accepted (values set 2026-10-07)
- Date: 2026-10-07

## Energy

- BMR: Mifflin-St Jeor
- Activity above rest, per logged block: `(MET − 1) × (BMR / 24) × hours` — net METs scaled to the user's own
  resting rate, so rest is not counted twice and heavier users are not overestimated
- Waking hours without a log fall back to "Sitting and short walks" (MET 1.4, to be calibrated)
- Intensity selects the Compendium code (light / medium / hard); without one, ±20%
- Routines use the same formula per exercise; kinds and codes in F18
- Climate does not change energy: the recalibration absorbs it. Climate only raises the drinks goal (F10)
- Day expenditure = (BMR + Σ activity) × 1.10 (thermic effect of food)
- Deficit from goal pace, 7,700 kcal per kg; capped at 1% of body weight per week and 25% of expenditure
- **Day target = expenditure − deficit, never below BMR**

## Macros

| | Default | Range (user setting) | Basis |
| --- | --- | --- | --- |
| Protein | **1.6 g × reference weight**, fixed all day | 1.2–2.2 | No further muscle gain beyond ~1.6 g/kg with resistance training (Morton 2018); 1.4–2.0 g/kg for exercising people (ISSN 2017) |
| Reference weight | `min(current, weight at BMI 25)` | — | Total weight overestimates needs in overweight users |
| Fat | **25% of the day target** | 20–35% | AMDR 20–35% of energy |
| Carbohydrates | Remainder | warn below 130 g | RDA 130 g/day |

## Recalibration

Weight trend = exponential moving average. With ≥ 14 days of weights, compare actual vs expected change and
adjust expenditure, at most ±10% per step. This absorbs the error of MET and BMR estimates.

## Consequences

- Protein never moves with activity; fat and carbohydrates do
- Users with kidney disease are told to agree protein with a doctor (onboarding notice)
