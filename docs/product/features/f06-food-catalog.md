# F06. Food catalog

- Release: v0.1
- Status: Approved 2026-10-07 · data model in ADR 0014

## What

Searchable foods and dishes with nutrients, available offline.

## Rules

- Three layers: **foods** (ingredients) · **seed dishes** (curated recipes) · **user dishes** (F07)
- Foods: Peruvian food composition tables (INS, 2023 edition) first; USDA FoodData Central for what INS lacks (B12, vitamin D, missing foods)
- Seed dishes: about 40 frequent Peruvian dishes, each a recipe of catalog foods in grams, reviewed once. When INS group S has the dish, its values cross-check the recipe (within ±20%)
- Household units per food (1 egg, 1 cup of cooked rice, ⅛ of a rotisserie chicken), so the user never needs grams; weights come from the INS household-measure tables and are editable
- **Sauces and creams: 1 portion = 40 g** (½ portion = 20 g), for homemade and bottled ones alike
- Every food and dish shows its source; a missing value shows "sin dato", never 0
- Search: dishes first, then foods; INS before USDA; tolerant to accents and typos
- Bundled in the app database; catalog updates arrive through sync

## Acceptance criteria

- [ ] Searching "plátano" returns Peruvian entries first, offline
- [ ] "juane" returns the seed dish with its ingredients and sources
- [ ] A food without an iron value shows "sin dato" and is left out of the iron coverage
