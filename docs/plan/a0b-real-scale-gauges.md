# A0b. Gauges at real scale (owner, 2026-11-01)

Goal: the coloured zones of every gauge at their real size (ADR 0027). JavaScript only: ships with the A6 update.

## Read

- ADR 0027, `docs/design/direction.md` (Range thresholds), F22, F24, `docs/design/tokens.md` (Gauges)
- `ZoneGauge` (`apps/mobile/src/components/data-display`) and every screen that uses it

## Steps

1. `packages/core` `gauge/scale.ts`, tests first: from the thresholds (and target or fixed range) to
   `{ min, max, zones: [{ from, to, tone }], position(value) → 0…1, overflow }`
2. Tests with ADR 0027's numbers: 2,000 kcal → 0–3,200 and 0.5 · 0.0625 · 0.125 · 0.0625 · 0.25; protein; fat;
   sugar in thirds; flours; waist-to-height; BMI unchanged
3. `ZoneGauge` draws each zone from its fractions (arc paths computed from angles, the same small gap between zones,
   at least 1° per zone so a thin zone stays visible). Delete the hard-coded paths
4. Use it everywhere: Today's six gauges, the six mini gauges of the portion preview, Profile (BMI, waist-to-height)
5. Update `docs/design/tokens.md` (Gauges) and the build notes of F22 and F24

## Done when

- [x] The 2,000 kcal test draws coral to 1,600, amber to 1,800, blue to 2,200, amber to 2,400, coral to 3,200
- [x] `rg "A 78 78"` finds no hard-coded zone path outside the generator; F22 and F24 criteria still pass
