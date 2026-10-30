# M5. Portion impact preview

Goal: see how the six gauges would move before adding a food (F05).

## Read

- `Picker.dc.html` (portion step), F05 (rule "Portion impact preview"), F22, ADR 0020

## Steps

1. `packages/core` pure function `day/portion-impact.ts`: day totals, targets and the item's nutrients × portion →
   per gauge `{ now, after, delta, zoneNow, zoneAfter }`, plus alerts: every gauge whose zone gets worse, and
   "Mucho azúcar para una comida" when the portion adds > 10 g of added sugar. Tests first
2. UI: six mini gauges with a grey "now" needle and a dark "after" needle (animated), "now → after" and a delta pill,
   a summary line with calories after, alert chips. Updates live as the portion changes
3. "‹ Resultados" and "Guardar como pendiente" stay on this step (M1, M2)

## Done when

- [ ] F05 criterion 6 (½ → 1 moves every needle and delta before adding); F22 new criterion 1
- [ ] Oscar tries it with real-looking portions on Kawsay Dev
