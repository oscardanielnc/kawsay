# F07. Custom dishes

- Release: v0.1 manual · v0.2 AI
- Status: Approved 2026-10-07 · prototype: design/explorations/2026-10-07-dish-insights-routine.html

## What

Build dishes the catalog lacks, or a personal version of a seed dish.

## Rules

- v0.1: the user builds the dish from catalog foods in household units or grams
- v0.2 AI flow (built in plan A0d as "Crear «…» con IA", ADR 0028):
  1. The user types a name ("juane de pollo"); existing dishes are searched first, without AI
  2. If nothing matches, the API asks the AI for ingredients and amounts only (JSON validated with Zod)
  3. Each ingredient is matched to a catalog food; unmatched ones show "no encontrado" and open the search
  4. The user edits amounts (e.g. 1/16 chicken), removes items or taps "¿Qué falta?" for more suggestions
  5. Nutrients are computed from the catalog; the dish is saved locally and synced
- A dish **yields N servings** (default 1): nutrients per serving = recipe total ÷ N
- Amounts in household units (1/32 chicken, 1 cup) or grams; the unit sheet shows the kcal of that amount
- The AI is called from the API, never from the phone (the key stays on the server)
- Without a connection, AI creation is unavailable; manual creation still works
- Logged with the portions of F05; every dish has an icon chosen at creation (soup, plate, rice, leaf-wrapped, skewer, fruit, juice, bread, egg, fish, sweet, nuts)
- Nutrient numbers never come from the AI

## Acceptance criteria

- [x] A saved dish is logged with one tap and portion 1
- [ ] An AI-built dish shows each ingredient with its catalog source before saving
- [x] Changing chicken from 1/8 to 1/16 updates the totals before saving
