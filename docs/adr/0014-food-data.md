# 0014. Food data: three layers and household units

- Status: Accepted
- Date: 2026-10-07

## Context

Peruvian street and home dishes (juane, chaufa, tacacho) are missing from most databases, a language model invents
nutrient numbers, and people think in "1 egg" or "⅛ chicken", not grams.

## Decision

- Foods: INS *Tablas Peruanas de Composición de Alimentos* (2023 edition, 11th digital edition 2025): 1,125 foods,
  22 nutrients per 100 g of edible portion. USDA FoodData Central (CC0) fills B12, vitamin D and missing foods
- Seed dishes: about 40 curated recipes of catalog foods in grams. INS group S (567 analysed preparations) is used
  only to cross-check them
- User dishes: same model as seed dishes, owned by the user and synced
- Tables: `food` (source, source_code, nullable per-100 g nutrients) · `food_unit` (food, label, grams) ·
  `dish` (owner null for seed) · `dish_item` (dish, food, grams)
- Missing values stay null; totals carry a coverage ratio
- Gap filling: an INS food may link to its closest USDA food; only the nutrients INS lacks (e.g. B12) are taken
  from it, marked with their source
- Branded foods (cookies, ice cream, sauces): values from the package label, source "label" with the date read;
  its own per 100 g column wins over scaling the serving, which labels round
- Seed data lives in `packages/catalog` as versioned JSON plus a build script; every row keeps its source code
- An "About the data" screen cites INS (reproduction authorised with attribution) and USDA

## Consequences

- Every number traces back to a source row, and dishes stay editable per ingredient
- The seed needs one curation pass; errors are fixed by editing a recipe, not code
- Household-unit weights are estimates: visible and editable

## Discarded

- AI-estimated nutrients per dish: cannot be verified
- Crowd-sourced databases: unknown quality and terms
- INS group S values as the dish itself: not editable per ingredient, mostly Lima recipes
