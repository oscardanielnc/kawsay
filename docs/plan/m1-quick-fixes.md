# M1. Quick fixes

Goal: the bugs and small changes Oscar asked for on 2026-10-30, before the redesign. Logic first; the new look
arrives in M3–M4.

## Read

- F05 (rules "One tap picks", "Back to results"), F10, F11 (build notes), F13, F17 (it uses bloating)
- Code: `apps/mobile/src/features/{meals,checkins,sleep,symptoms,insights}`, `components/feedback/Sheet.tsx`

## Steps

1. **Nap duplicates (F11):** the prefilled nap draft gets its id when it is shown; every save upserts by id (as
   nights already do). A new nap only comes from "+ Agregar siesta". Test: five quick stepper taps leave one nap
2. **First tap with the keyboard open (F05):** every list inside the add sheet gets
   `keyboardShouldPersistTaps="handled"` (nested lists do not inherit it from `Sheet`), and the sheet must not jump
   when the keyboard hides before the press lands. Oscar confirms on the phone
3. **Back to results (F05):** lift the query and results out of `DishPicker` into the sheet state, so "‹ Resultados
   de «…»" on the portion step returns to the same text and list. Test it
4. **Faces (F10):** most negative on the left in every scale (stress inverted), no background, each face its own
   colour; before a pick all faces are grey (`face-off` token), the picked one takes its colour and grows to 1.14
5. **Bloating removed (F10):** off the day screen and the day checklist; history and export keep old entries.
   F17 tests that seed bloating keep working with another symptom
6. **Hydration optional and collapsed (F10):** urine colour always visible and it is the checklist step; drinks open
   on tap
7. **Symptom episodes (F13):** a symptom is marked every day it is present; from day 2 the card asks "¿Sigues con X
   hoy?" (Sí, sigue · Ya se fue); consecutive days are one episode. Insights use the first day of each episode

## Done when

- [x] Tests for 1, 3, 5 and 7; criteria ticked in F05, F11, F13 (on-the-phone ones after Oscar checks)
- [ ] Report offers to publish these fixes now (EAS Update), only with Oscar's OK
