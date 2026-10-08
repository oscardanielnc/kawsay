# 0008. AI picks, the table computes

- Status: Accepted
- Date: 2026-10-07

## Context

Numbers invented by a language model cannot be verified or defended.

## Decision

- Nutrients come only from the food catalog: Peruvian food composition tables (INS/CENAN) first, USDA FoodData
  Central as fallback. Each food stores its source
- Calories burned: METs from the Compendium of Physical Activities, computed as net energy above rest (ADR 0009)
- The AI only chooses (ingredients and grams, closest MET, wording); deterministic code computes
- The catalog is bundled in the app database so search works offline; updates arrive through sync

## Consequences

- Every number on screen traces back to a source row
- Check the licence/terms of each data source before public release
