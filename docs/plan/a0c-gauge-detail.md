# A0c. Gauge detail (F26, owner 2026-11-01)

Goal: tap a gauge → the gauge large with every limit labelled, and what added most to it, largest first.
JavaScript only: ships with the A6 update.

## Read

- F26, ADR 0027, `docs/design/explorations/2026-11-01-gauge-detail.html` (open it in a browser; its script has
  reference versions of `scale` and `layoutLabels`), `Sheet`, `ZoneGauge`, the day totals code

## Steps

1. `packages/core` `gauge/label-layout.ts`, tests first: limit fractions + gauge geometry → for each label its side,
   y and leader points. Tests for every gauge kind and extreme targets: no overlapping labels, no label inside the
   arc band, leaders never cross
2. `packages/core` `day/contributions.ts`, tests first: the day's entries + a metric → rows `{ id, name, meals,
   portions, amount, share }` grouped by food or dish, largest first, zeros left out; pending entries apart
3. Mobile `GaugeDetailSheet` (react-native-svg): metric chips, the big gauge with ticks, dotted leaders and side
   labels, the centre block, the list; opens from every gauge on Today and on past days; the sugar extra chip
4. RNTL tests: opening from a gauge, switching chips, row order, the pending line

## Done when

- [x] F26 criteria pass; no native module
