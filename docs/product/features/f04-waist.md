# F04. Waist

- Release: v0.1
- Status: Approved 2026-10-07 (revised: weekly and optional)

## What

Optional weekly waist measurement with a tape, to see fat loss when the scale stalls.

## Rules

- Off by default; when on, a weekly reminder on the day the user picks
- Measuring rule shown every time: on waking, after the bathroom, at the navel, tape snug but not tight
- Centimetres; one value per week (editing replaces it)
- Progress chart with weekly points; not part of the day ring or the day colour
- Profile shows the waist-to-height ratio from the last measurement: green < 0.5 · yellow 0.5–0.59 · red ≥ 0.6 (NICE 2022)
- No morning-vs-night measure: bloating is tracked with the relative scale (F10)

## Acceptance criteria

- [ ] With the reminder on, the week's measurement takes one input
- [ ] Weeks without a measurement leave a gap, not a zero
- [ ] 92 cm at 170 cm shows 0.54 in yellow, "Riesgo aumentado"
