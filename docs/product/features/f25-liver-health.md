# F25. Liver health

- Release: next (build plan M6)
- Status: **Approved by the owner 2026-10-30** · targets: ADR 0020 · prototype: the owner's design canvas
  "Kawsay — Hoy rediseñado", Analysis board, "Hígado" card (copy in
  [design/explorations/2026-10-30-amanecer](../../design/explorations/2026-10-30-amanecer/README.md))

## Why

Metabolic dysfunction-associated steatotic liver disease (MASLD, formerly NAFLD) affects about 36% of adults in
South America (ALEH working group, 2025). Its drivers are known and mostly measurable with what Kawsay already logs.
Kawsay never diagnoses: it shows the habits that guidelines tie to liver fat and points to a doctor for tests.

## Rules

- A **Liver card** in Insights, weekly (same week and ‹ › as F20), computed on the phone from logged data, no AI
- Header: "Hígado · lo que más lo cuida, esta semana" and a pill "n de 7 en rango" (the sugar block and the six tiles; blue ones count)
- **Sugar first**, in its own peach block: the week's daily average of added sugar vs the 5% and 10% limits, seven
  bars (one per day, coloured by zone) with a line at the 5% limit, a chip with the week's sugary drinks and the
  day that added most. One line of why: sugar, above all in drinks, is what leaves the most fat in the liver
- Then tiles, each with value, target and a coloured dot (ADR 0020): movement minutes, strength days, alcohol
  grams, sleep average, waist-to-height (last measurement, F04), weight change over 4 weeks vs the goal (F01)
- A row without data shows "sin dato" in grey, never a zero
- Turning the card on (Profile → modules → "Hígado") offers to turn on the weekly waist reminder (F04)
- Optional **lab log**: date, AST (TGO), ALT (TGP) and platelets; the app computes FIB-4 with its bands and
  "habla con tu médico" from 1.30. Labs live only on the phone (local table, in the export F15), are never synced
  and never reach the AI. Without labs the row reads "Falta TGO y TGP" with an "Agregar" button
- Footer, always: not a diagnosis; targets from WHO, EASL and NICE; with relatives who have fatty liver, ask a doctor
  for an ultrasound

## Acceptance criteria

- [x] The card computes from logged data only, offline
- [x] Daily added sugar 18, 30, 12, 26, 41, 22 and 19 g with a 1,700 kcal target shows 24 g in amber, and the four
      bars above 21.25 g in amber
- [x] Two sugary drinks in the week show "2 bebidas azucaradas · meta 0" in amber
- [x] A week without sleep logs shows "sin dato", not 0 h
- [x] FIB-4 for 40 years, AST 30, ALT 36 and platelets 250 gives 0.80 (low) and is labelled as a screening score
- [x] No lab value appears in the sync outbox or in an AI request

## Build notes

- 2026-10-30 (M6): rules in `packages/core` (`liver/*`, `energy/movement-minutes`, `energy/strength-days`,
  `sleep/week-average`, `profile/liver-goal`). The card is `compose/liver.ts` + `features/liver/LiverCard.tsx`,
  loaded apart from `InsightsData`, so `buildAnalysisRequest` cannot see lab results (a test checks it)
- Labs live in the local table `lab_result`: no outbox triggers, not a synced collection; `labs.csv` in the export
- Tiles: movement and strength days from activities (weights and routines are strength); alcohol from drinks with
  their % (older ones without it count as "sin tipo"); weight change is the trend over 4 weeks, blue when it moves
  toward the goal

