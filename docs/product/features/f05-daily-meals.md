# F05. Daily meals

- Release: v0.1
- Status: Approved 2026-10-07

## What

Four slots per day: breakfast, lunch, dinner, snacks.

## Rules

- The add sheet shows a search box, the 12 most recently used dishes as icon tiles (filtered while typing) and a large "Create dish" button
- Portion: ¼, ½, ¾, 1, 1½ or 2 servings, or grams; nutrients scale with it
- Below one serving: optional "save the rest for tomorrow's breakfast", which pre-adds the remainder there
- **Drinks with calories (juice, soft drink, milk, energy drink) are logged as food**, in the meal where they were drunk. Each carries its volume and **also counts toward hydration automatically** (one entry, two views)
- Logged items appear as icon chips under their slot
- Day totals vs targets: calories, protein, fat, carbohydrates

## Acceptance criteria

- [x] Repeating yesterday's breakfast takes one tap plus the portion
- [x] Half a dish at dinner with "save the rest" shows the other half in tomorrow's breakfast
- [ ] A juice added to breakfast adds its calories there and fills its glasses in hydration, marked as "from breakfast"

## Build notes

- 2026-10-08: built in `apps/mobile/src/features/meals`. Criterion 3: calories and the drink volume "from
  breakfast" are stored (`drinksFromMeals`); the glasses are drawn by F10. "Create dish" is shown disabled until F07
- A food's serving is its first household unit ("1 vaso" = 250 g); a dish of group `drink` or a food whose first unit
  is a "vaso" carries its volume to hydration
