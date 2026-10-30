# M8. Every other screen in the new style

Goal: no screen left in the old look (owner, 2026-10-30).

## Read

- `docs/design/direction.md` sections for each screen; the Amanecer README; Components board

## Steps

1. Calendar (month blanket in blue · amber · coral · grey)
2. Insights: week card, vitamins and minerals, relations (the Liver card and AI card are done)
3. Profile: status gauges (BMI, waist-to-height), target card (adds the sugar ceiling and the refined-flours limit,
   editable), modules (incl. "Hígado"), settings
4. Create dish (F07) with the full INS search from M2; routine editor (F18)
5. First use (6 steps), every sheet, empty and error states
6. App icon and splash are native: out of scope unless Oscar asks (new APK)

## Done when

- [x] `rg` finds no old token or Bricolage import (Bricolage stays only in `app.config.ts`, native, until an APK)
- [ ] Oscar walks every screen on Kawsay Dev

## Build notes (2026-10-30)

- Every screen sits on `GradientBackground`; tab titles use `display`; secondary text on screens is `ink-soft`
  (ink-muted fails on the gradient top). Cards were already the Amanecer `Card`
- Profile → targets edits the refined-flour limit (10–100 %); the summary row shows it. Week card: strength days
  "n de 2" and movement minutes by MET (ADR 0020), also in the day checklist
- Illustrations (food and activity icons) keep their own colours; the old profile `ArcGauge` takes the new zone
  colours. Oscar's walk through every screen on Kawsay Dev is pending

