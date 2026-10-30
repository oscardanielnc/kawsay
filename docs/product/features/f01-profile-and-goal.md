# F01. Profile and goal

- Release: v0.1
- Status: Approved 2026-10-07 · prototype: design/explorations/2026-10-07-onboarding-profile.html

## What

Ask age, sex, height, current weight, goal weight and goal date.

## Rules

- Base target (a day without activity) = basal metabolic rate, Mifflin-St Jeor
- If the requested pace is above ~1% of body weight per week, warn and propose a later date
- **Liver-aware goal (owner, 2026-10-30; ADR 0020):** with BMI ≥ 25 the goal step suggests losing 7–10% of the
  current weight, at the usual pace limit; any goal can still be chosen
- Climate where the user lives: warm / temperate / cold. It changes the drinks goal (warm +2 glasses), not calories: the weight-trend recalibration absorbs any climate effect on energy
- Usual sleep schedule (night and nap) to prefill sleep
- All values editable later; targets recompute
- First use, 6 steps: account → body → goal (live pace, warning above 1%/week with a suggested date) → climate and usual sleep → modules to log → daily target with ⓘ formula, "not a medical app" and the kidney-disease notice
- **Profile opens with "Your status today":** BMI = trend weight ÷ height² (F03 trend, not the raw weight), WHO adult bands in colour: red < 17 "Delgadez marcada" · yellow 17–18.4 "Bajo peso" · green 18.5–24.9 "Peso saludable" · yellow 25–29.9 "Sobrepeso" · red ≥ 30 "Obesidad grado I/II/III"
- The BMI track runs 15–35 with a "you" marker and a 🚩 at the goal weight; below it, the kg to the green range; then the waist-to-height ratio (F04) and an ⓘ: BMI does not tell muscle from fat, does not apply under 18 or in pregnancy, and is not a diagnosis
- Then the day's target card (kcal, protein, fat, carbohydrates, movement minutes) and the settings: body, goal, target settings (protein 1.2–2.2 g/kg, fat 20–35%, daily movement), climate, sleep, modules, routines, symptoms, export, about the data, sign out

## Acceptance criteria

- [x] Given 80 kg, 170 cm, 30 years, male, the base target is shown without further input
- [x] A goal of −10 kg in 4 weeks shows a warning and a suggested date
- [x] 80 kg and 170 cm show BMI 27.7 in yellow, "Sobrepeso", and "−8.0 kg" to the green range
- [ ] 80 kg with BMI 27.7 suggests a goal between 74.4 and 72.0 kg

## Build notes

- 2026-10-08: built in `apps/mobile/src/features/profile` (tests named after these criteria). The account step
  arrives with F02; until then the profile lives on the phone only. Export, routines and own symptoms rows arrive
  with F15, F18 and F13
