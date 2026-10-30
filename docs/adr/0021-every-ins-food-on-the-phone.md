# 0021. Every INS food on the phone; USDA stays a source, not a list

- Status: Accepted (plan M2, approved by the owner 2026-10-30)
- Date: 2026-10-30

## Context

F23 piece 2: any ingredient usable in Create dish without a release. The app bundled 151 curated foods
(`catalog.json` 336 KB, 60 KB gzip). INS 2023 has 1,125 foods; USDA SR Legacy 7,793. The plan allowed USDA under
"Más resultados" only if the update grew less than 2 MB compressed.

## Options considered

| Option | catalog.json | gzip | Growth (gzip) |
| --- | --- | --- | --- |
| Curated only (before) | 336 KB | 60 KB | — |
| **+ every INS food** | 1.02 MB | 122 KB | +62 KB |
| + every INS and USDA food | 6.96 MB | 712 KB | +590 KB |

USDA fits the size budget, but: its names are English (the app searches in Spanish), it has no added-sugar column
and thousands of its foods are sweets and packaged products, so F22 criterion 4 ("every packaged or prepared food has
an explicit added-sugar value") would turn false, or we would have to guess. Searching 9,000 rows on every keystroke
and loading them into SQLite on every catalog change also costs the phone.

## Decision

- The build emits every INS row the seed does not curate as a **generic food** `ins-<code>`: INS name, grams only,
  values as INS prints them, `generic: true`. Usable as an ingredient in Create dish; search lists them after the
  curated foods
- Added sugar of INS foods: `seed/added-sugar.json` lists every sweet, sweetened or packaged one (USDA analogue or
  rule noted, estimates marked `doubtful`); any other INS food has 0. A test keeps the list complete
- USDA stays what ADR 0014 made it: a source the seed links to by hand, not a list on the phone
- Tags live in `seed/tags/<tag>.json` (`refined-flour`, `drink`), reviewed once; dishes inherit them

## Consequences

- +62 KB gzip per update; the phone loads 1,165 foods instead of 151 once per catalog change
- A missing food that INS does not have still needs the pending entry (F23 piece 1) or a label food (piece 3)
- Revisit USDA only with Spanish names and an added-sugar rule for its sweets
