# F18. Routines

- Release: v0.1 (free-text exercise: v0.2)
- Status: Approved 2026-10-07 · prototype: design/explorations/2026-10-07-dish-insights-routine.html

## What

Users define their own workouts once; calories are computed per exercise and logged with one tap.

## Rules

- A routine has a name, a rest between sets (default 75 s) and a list of exercises
- Each exercise has a kind, which sets how its time is measured and its MET (2024 Adult Compendium):

| Kind | Time | MET light / medium / hard (code) |
| --- | --- | --- |
| Weights | sets × (reps × seconds per rep + rest) | 3.5 (02054) / 5.0 (02052) / 6.0 (02050) |
| Bodyweight | same | 3.0 (02056) / 3.8 (02022) / 6.5 (02057) |
| Circuit (non-stop bodyweight cardio) | same | 3.5 (02034) / 5.0 (02035) / 6.0 (02032) |
| Isometric (plank) | sets × (seconds + rest) | 2.8 (02024) |
| Stairs, up and down | laps × lap time | 7.5 (17138) |
| Mobility | minutes | 2.3 (02101) |

- Kinds with a single code (isometric, stairs, mobility) scale their MET −20% light / +20% hard (ADR 0009)
- "Per side" doubles the work time. Effort uses the F08 talk test: light "you can talk" · medium "short sentences" · hard "can barely talk"
- Rest counts: the Compendium weight-training values were measured over whole sessions, rests included
- Stairs: the lap time is measured once with an in-app stopwatch and reused
- kcal per exercise = (MET − 1) × (BMR / 24) × hours × 1.10 (ADR 0009); the editor shows kcal and minutes per exercise and in total, with an ⓘ listing each MET and code
- Logging asks how much was done (100 / 75 / 50 / 25%) or, with "Adjust per exercise", the sets or laps actually done; plus the time band
- **Rounds:** a routine can be marked "by rounds" (a circuit defined as one round). Logging it asks **rounds done** (½ to 6, default 1) instead of the percentage; minutes and kcal multiply by the rounds
- **Templates:** "+ Routine" offers "From a template": Cardio en el cuarto, Fuerza A and Fuerza B ([routine-templates.md](../routine-templates.md)). A template is copied into an ordinary routine, fully editable
- v0.2: "Other" exercise in free text → the AI picks the closest Compendium code → the user confirms
- Level 3 (v0.3): per-session sets × reps × weight for strength progress (not calories)

## Acceptance criteria

- [x] Logging a routine at 75% records 75% of its minutes and calories
- [x] Adjusting stairs from 4 to 6 laps adds 2 × lap time at MET 7.5
- [x] Editing a routine does not change sessions already logged
- [x] Logging "Cardio en el cuarto" with 3 rounds records 3 × its minutes and kcal
- [x] Creating a routine from the "Fuerza A" template gives the five exercises with their sets, reps and rest, editable
