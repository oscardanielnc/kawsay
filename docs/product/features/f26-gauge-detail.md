# F26. Gauge detail

- Release: next (build plan A0c)
- Status: Approved by the owner 2026-11-01 ("es importante para saber qué comidas han sumado más en cada
  velocímetro") · prototype: [design/explorations/2026-11-01-gauge-detail.html](../../design/explorations/2026-11-01-gauge-detail.html)

## What

Tap a gauge → a sheet with that gauge large, every limit labelled, and the list of what added to it, largest first.

## Rules

- Opens from the six gauges of Today and of any past day. Chips switch the metric without closing (Calorías,
  Proteína, Grasa, Carbohidratos, Azúcar añadida, Harinas); ✕ or swipe down closes
- **Big gauge** at real scale (ADR 0027). Every limit between two zones has a tick on the arc and a dotted leader to
  its number in a side column: left for limits on the left half, right for the right half, a limit near the top to
  the emptier side. Numbers are at least 30 dp apart, never touch the arc, the needle or each other, and the leaders
  keep the arc's order, so they never cross. Each number has a two-tone dot with the colours of the zones it
  separates. 0 and the maximum sit under the ends
- Centre: the value ("+" past the maximum), the state pill as on Today (including "Faltan ~N · el día sigue" while
  the day is open), one line with the target and the blue range (two-sided) or the limit (one-sided), and the legend
  En rango · Cerca · Lejos
- **"Lo que más sumó"**: every food or dish of that day with what it added to that metric, largest first: icon, name,
  meals and portion ("Almuerzo · ¼ con papas"), amount with unit ("878 kcal"), share of the total (%) and a thin bar.
  The same food in several meals is one row with the sum ("Almuerzo y cena"). Foods that add nothing are left out
  and counted in one line
- Pending entries (F23) are listed apart: "N pendiente sin contar · name" with "Completar"
- Added sugar also shows the week's sugary drinks (F22); refined flours say "tu límite" (F24)
- Numbers come from the catalog (ADR 0008), computed on the phone, offline
- Accessible: the gauge has a text description with the value and the limits; rows ≥ 56 dp; reduce motion respected

## Acceptance criteria

- [ ] With a 2,000 kcal target the calories detail shows 1.600, 1.800, 2.200 and 2.400 on the sides and 0 and
      3.200 under the ends
- [ ] A layout test for every gauge kind and extreme targets finds no labels overlapping and none inside the arc band
- [ ] Pollo a la brasa, 878 kcal at lunch, is the first calories row with its share of the day
- [ ] An Inca Kola at lunch and another at dinner are one row with the sum and "Almuerzo y cena"
- [ ] Switching to Azúcar añadida reorders the list by grams of added sugar and leaves out foods without it
