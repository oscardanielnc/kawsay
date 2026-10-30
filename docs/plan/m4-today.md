# M4. Today redesigned

Goal: the Today screen exactly as `Main.dc.html`.

## Read

- `Main.dc.html` (layout, texts, states in `renderVals()`), F05, F10, F11, F13, F22, F24 and the range thresholds in
  `docs/design/direction.md`

## Steps

1. Order: header (date, ‹ ›, picker) · "Tu día registrado" checklist (urine colour is the hydration step) · six gauges
   in a 2 × 3 grid (calories, protein, fat, carbohydrates, added sugar, refined flours) · meals with a fixed "+" in each
   header · activity · hydration collapsed · body and mood faces · sleep · symptoms (episode card) · private card ·
   floating tab bar
2. Gauges: same thresholds, new colours; calories under target during the day read grey "Faltan ~N · el día sigue"
3. Refined-flours gauge (F24): carbohydrate grams from tagged foods vs 50% of the carbohydrate target (personal limit,
   editable in Profile in M8)
4. Past days use the same screen
5. Performance: the screen scrolls at 60 fps on Oscar's phone; memoise gauge rows

## Done when

- [ ] F22 criteria still pass; F24 criterion 2 (changing the limit moves the zones the same day)
- [ ] Oscar checks it on Kawsay Dev against the mockup
