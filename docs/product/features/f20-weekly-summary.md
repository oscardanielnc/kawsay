# F20. Weekly summary

- Release: v0.1 (brought forward 2026-10-12)
- Status: Approved 2026-10-07 · prototype: design/explorations/2026-10-07-dish-insights-routine.html

## What

First card of the Insights tab: the week at a glance.

## Rules

- Same week as F19, with ‹ › to move between weeks
- Days by colour: green · yellow · red (F14 rules); grey days are not counted
- Movement minutes of the week vs 150, with an "ideal" badge from 300, and strength days vs 2 (WHO 2020; counting
  rules in ADR 0020: MET ≥ 3 counts, MET ≥ 6 counts double)
- Colours blue · amber · coral (Amanecer redesign); the counters keep their meaning
- Weight trend change over the week (F03), shown only with at least 3 weights that week

## Acceptance criteria

- [x] A week with 4 green, 2 yellow and 1 red day shows "4 · 2 · 1"
- [x] With 2 weights in the week, the weight tile reads "Pésate más días"
- [x] 100 min of brisk walking plus 30 min of stairs (MET 7.5) show 160 min in blue
- [x] One weights routine in the week shows strength "1 de 2" in amber
