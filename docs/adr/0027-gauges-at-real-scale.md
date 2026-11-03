# 0027. Gauges at real scale

- Status: Accepted (owner, 2026-11-01) · replaces the fixed zone widths of 2026-10-12
- Date: 2026-11-01

## Context

Since 2026-10-12 every zone had a fixed share of the arc (two-sided 10 · 18 · 44 · 18 · 10 %, one-sided 3/7 · 2/7 ·
2/7) so the limit labels would not overlap. The owner finds it confusing: the arc does not show how far a value really
is. The Amanecer design already moved the limits to a text line under the number, so no labels sit on the arc.

## Decision

- Every gauge is linear from its minimum to its maximum, and each zone takes its real share of the arc. The thresholds
  do not change (direction.md, F22, F24, ADR 0020)
- Two-sided gauges run from 0 to the start of the upper coral zone + 40% of the target:

| Gauge | Maximum | Coral · amber · blue · amber · coral (% of the arc) |
| --- | --- | --- |
| Calories | 160% of target | 50 · 6.25 · 12.5 · 6.25 · 25 |
| Protein | 200% | 35 · 10 · 20 · 15 · 20 |
| Fat, carbohydrates | 175% | 37.1 · 8.6 · 22.9 · 8.6 · 22.9 |

- The owner's example: target 2,000 kcal → arc 0–3,200: coral to 1,600, amber to 1,800, blue to 2,200, amber to 2,400,
  coral to 3,200
- One-sided gauges run from 0 to 1.5 × the start of coral: added sugar 0–15% of kcal in thirds; refined flours blue
  44.4 · amber 22.2 · coral 33.3 %
- Profile: BMI stays linear 15–35; waist-to-height becomes linear 0.30–0.75
- The needle stops at the ends; past the maximum the number shows "+"
- While the day is open, values under blue keep the grey "Faltan ~N · el día sigue" pill; the arc keeps its colours
- One pure function, `packages/core` `gauge/scale`, gives the zones and the needle position to every gauge: Today,
  the portion preview and Profile

## Consequences

- Narrow zones look thin (calories amber 6%): that is the real distance, as the owner asked
- Zone paths are computed, no longer hard-coded
