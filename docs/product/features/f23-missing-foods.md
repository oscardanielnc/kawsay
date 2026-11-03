# F23. Missing foods without a new release

- Release: proposal
- Status: **Pieces 1 and 2 approved by the owner 2026-10-30**, built (plan M2) · **pieces 4, 5 and the new piece 6
  approved 2026-11-02** (plan A0d, ADR 0028): the owner found no new dishes after M2, only ingredients · piece 3 later

## Problem

The app bundles only the curated catalog (151 foods, 107 dishes, `packages/catalog/dist/catalog.json`). When a
food is missing, the owner edits the seed and ships an update just to log one meal, or loses the entry.
Meanwhile the full sources already sit in the repo: INS 2023 (1,125 foods) and USDA SR Legacy (7,793 foods).

## Proposed pieces

| # | Piece | Solves | AI |
| --- | --- | --- | --- |
| 1 | **Pending entry:** type the name and portion, save now; the item shows as "to complete" and the day recalculates when it is completed | Never losing a log | No |
| 2 | **Every ingredient on the phone:** all INS foods (and USDA under "more results") usable in Create dish, with generic units (g, cup, tablespoon, unit) | Building any dish without a release | No |
| 3 | **Own food from a label:** create a product from its label (per 100 g or per serving); later, a label photo is read by an AI vision model and the user confirms each number | Branded cookies, ice cream, sauces | Reads, never invents |
| 4 | **AI dish (F07 v0.2):** name → AI proposes ingredients and grams → the table computes → confirm. Already designed | New Peruvian dishes in seconds | Picks, table computes (ADR 0008) |
| 5 | **Catalog by sync:** curated additions arrive from the API, not inside the app bundle | Curation without app updates | No |
| 6 | **Thousands of dishes:** 544 official INS group S dishes (data ready 2026-11-02) + AI recipes over the catalog foods up to ≥ 2,000, checked automatically, shown as "Receta estimada" (ADR 0028) | Torta helada, tequeños, arroz árabe in one tap | Picks, table computes |

Not proposed now: barcode lookup in Open Food Facts. It is crowd-sourced (discarded in ADR 0014), and Peruvian
coverage is thin (e.g. 273 snacks listed for Peru, October 2026).

## Rules (if approved)

- User foods and pending entries are synced records with their own contract schemas (ADR 0018)
- A pending entry counts as "logged" in the day checklist but adds no nutrients until completed; totals show "pending"
- Nutrient numbers keep a source: INS, USDA, label or user
- Pieces 3 and 4 run through the API AI gateway (ADR 0007); without a connection they are unavailable, 1 and 2 still work

## Acceptance criteria (draft)

- [x] A food missing from the catalog is logged in under 10 s with no app update
- [x] Completing a pending entry recalculates that day's totals, targets and micronutrients
- [x] Any INS food can be added to a dish offline
- [ ] A label food shows "Label" as its source and its date
- [ ] Searching "torta helada", "tequeños" and "arroz árabe" finds one dish each (the owner's examples)
- [ ] The catalog has at least 2,000 dishes, every one passing the automatic checks of ADR 0028
- [ ] A dish published on the API reaches the phone without an app update
- [ ] "Crear «X» con IA" builds a dish whose nutrients all come from the table

## Build notes

- 2026-10-30, pieces 1–2 (plan M2). Pending meal: synced table `pending_meal` (name, portion in words, meal);
  "Guardar «…» como pendiente" in the add sheet; a dashed peach chip "… · pendiente"; "Completar" opens the search
  with its name and logs the real entry and tombstones the pending one in one transaction. It counts toward the
  meals step of the day checklist and adds nothing to the totals
- Every INS row the seed does not curate ships as a generic food `ins-<code>` (1,014 foods): Create dish only,
  after the curated results. USDA stays out of the phone (ADR 0021)
- The API needs the new contract before the app update reaches a phone (it rejects unknown collections)

