# F08. Activities and calories burned

- Release: v0.1 · v0.2 free text
- Status: Approved 2026-10-07

## What

Log what you did; calories burned add to the day's target.

## Rules

- Icon catalog: in bed, sitting and short walks, walking, motorbike, weights, cardio, stairs, other — with duration and intensity
- Calories above rest = (MET − 1) × (BMR / 24) × hours × 1.10 (ADR 0009). Each type has a MET per intensity from the 2024 Adult Compendium (e.g. weights 3.5 / 5.0 / 6.0, stairs 6.8, brisk walk 3.5); types without separate codes scale ±20%
- The extra kcal is shown before saving, with an ⓘ that explains the formula
- The base day is "Sitting and short walks" (MET 1.4) and is always counted; the user does not confirm it
- **"No physical activity"** button: declares a day without exercise; exclusive with logging activities
- Activities carry a time band (exact time optional); several per day
- Routines are computed per exercise (F18)
- v0.2: a new activity in free text → the AI picks the closest MET → the user confirms

## Acceptance criteria

- [ ] 30 min of stairs raises the day's target immediately
- [ ] Choosing "No physical activity" hides adding; logging an activity clears it
