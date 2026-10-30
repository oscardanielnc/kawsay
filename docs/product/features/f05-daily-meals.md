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
- **One tap picks a result, even while the keyboard is open** (owner, 2026-10-30): today the first tap only hides the keyboard
- **"Back to results"** on the portion step returns to the same search text and results (owner, 2026-10-30): today a wrong pick forces closing the app
- Not in the catalog: "Save as pending" (F23)
- **Portion impact preview** (owner, 2026-10-30): the portion step shows the six gauges small, a grey needle for now
  and a dark one for "after this portion", each with "now → after" and the delta; a summary with the calories after and
  a chip for every gauge that would go high, plus "Mucho azúcar para una comida" when the portion adds more
  than 10 g of added sugar (ADR 0020). It updates as the portion changes, so the user decides before eating
- **The add button never moves** (owner, 2026-10-30): a "+" at the right of each meal's header, not after the chips
- Logged items appear as icon chips under their slot
- Day totals vs targets: calories, protein, fat, carbohydrates

## Acceptance criteria

- [x] Repeating yesterday's breakfast takes one tap plus the portion
- [x] Half a dish at dinner with "save the rest" shows the other half in tomorrow's breakfast
- [x] A juice added to breakfast adds its calories there and fills its glasses in hydration, marked as "from breakfast"
- [ ] With the keyboard open, one tap on a result opens its portion (checked on the phone)
- [x] Back from the portion step shows the same query and results
- [ ] Changing the portion from ½ to 1 moves every preview needle and delta before adding

## Build notes

- 2026-10-08: built in `apps/mobile/src/features/meals`. Criterion 3: calories and the drink volume "from
  breakfast" are stored (`drinksFromMeals`); the glasses are drawn by F10. "Create dish" is shown disabled until F07
- A food's serving is its first household unit ("1 vaso" = 250 g); a dish of group `drink` or a food whose first unit
  is a "vaso" carries its volume to hydration
