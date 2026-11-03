# 0028. Thousands of dishes: INS group S first, AI recipes over the table next, delivered by sync

- Status: Accepted (owner, 2026-11-02: "quiero que haya miles de variedades de platos y comidas para poder elegir")
- Date: 2026-11-02

## Context

The app had 107 curated dishes and 1,165 foods (ADR 0021): no "torta helada", "tequeños" or "arroz árabe" in one tap.
INS group S (`sources/ins-2023/prepared.csv`) has 567 Peruvian preparations with official nutrients, used until now
only to cross-check seed dishes, with almost no desserts or bakery. USDA FNDDS has English names and US recipes.

## Options considered

- Curate by hand: a few dishes a week · USDA FNDDS: wrong names and recipes for Peru
- **INS group S as dishes, then AI recipes over the catalog foods for the rest, checked automatically, delivered by
  catalog sync, plus "Crear con IA" for anything still missing**: chosen

## Decision

- **Layer 1, official:** `scripts/build_ins_dishes.py` → `seed/generated/ins-dishes.json`, 544 dishes (the rest are
  curated already): per 100 g = median of the strata; serving = the ENCONUT plate when the name matches (301), else
  the median plate of its kind; added sugar and refined-flour carbohydrate estimated by explicit rules recorded per
  dish; water null (group S leaves out the cooking water). `source: INS-S`
- **Layer 2, estimated:** a dish list by category (desserts and bakery first, then criollo, regional, chifa, nikkei,
  street food, fast food, international, drinks, holidays) to pass 2,000 dishes with aliases; the AI returns only
  ingredients (catalog ids), grams, servings, household unit and icon, never nutrients (ADR 0008); added sugar and
  tags come from the ingredients; `source: estimated`, shown as "Receta estimada"
- Automatic checks for layer 2: ids exist, kcal per 100 g and per serving inside the category range, macros add up,
  duplicates merged; one corrected retry, then out and listed in the build report
- Generation uses no personal data, so the Gemini free tier is allowed; `deepseek-flash` is the fallback
- Search order: curated, INS-S, estimated, generic INS foods
- **Catalog by sync** (F23 piece 5): the API serves catalog versions, the phone pulls the difference into SQLite
- **"Crear «…» con IA"** (F07 v0.2, F23 piece 4) from an empty search, the portion step and the text agent

## Consequences

- The bundle stays the same; the phone stores about 2 MB more after the first sync
- Estimated values (layer 2, and sugar and flour in layer 1) can be off: the detail says so; the user can edit a copy
