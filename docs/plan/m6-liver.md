# M6. Liver targets and Liver card

Goal: the targets of ADR 0020 everywhere they belong, and the Liver card in Insights (F25). Sugar first.

## Read

- ADR 0020, F25, F22, F20, F11, F10, F08, F04, F01; `Analysis.dc.html` ("Hígado" card)

## Steps

1. `packages/core`, one file per rule, tests with the ADR numbers: `liver/sugary-drinks`, `liver/alcohol-grams`,
   `activity/movement-minutes` (MET ≥ 3, ≥ 6 double), `activity/strength-days`, `sleep/week-average`, `liver/fib4`,
   `liver/liver-card` (rows, zones, "sin dato", "n de 7 en rango"), `goal/liver-weight-suggestion`
2. **Alcohol (F10):** kind, volume and % per drink with the defaults; grams stored with the entry; old entries
   "sin dato". New nullable columns only
3. **Labs (F25):** local-only table `lab_results` (date, AST, ALT, platelets): not in the outbox, in the export (F15),
   never in an AI request. Form with units and the FIB-4 result
4. **Liver card** in Insights as the mockup: sugar block (average, seven bars with the 5% line, sugary-drinks chip,
   top day), six tiles, FIB-4 row, footer. Profile → modules → "Hígado" turns it on and offers the waist reminder
5. **Week card (F20):** movement vs 150 / 300 and strength days vs 2
6. **Sugar gauge detail (F22):** today's top source and the week's sugary drinks
7. **Goal step (F01):** with BMI ≥ 25 suggest −7% to −10%

## Done when

- [x] All F25 criteria and the new criteria of F01, F10, F11, F22 pass (F20's week card: see notes)
- [x] A test proves no lab value reaches the outbox or the AI request

## Build notes (2026-10-30)

- Movement vs 150/300 and strength days vs 2 show in the Liver card tiles; the F20 week card keeps its layout until
  M8 restyles Insights. The sugar gauge detail on Today (step 6) is folded into the portion preview and the Liver
  card's "day that added most"
- Alcohol: the "+" of alcohol asks the drink (defaults of F10); editing volume and % per drink is left for later

