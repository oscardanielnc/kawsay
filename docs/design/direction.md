# Visual direction

- Status: Approved 2026-10-07 · **design closed** (all screens approved)
- Board: [explorations/2026-10-07-board.html](explorations/2026-10-07-board.html) · Prototypes: [v1](explorations/2026-10-07-today.html) (superseded) · [v2](explorations/2026-10-07-today-v2.html)

## Choices

| Area | Choice | From |
| --- | --- | --- |
| Navigation | **N1** tabs: Today · Calendar · (+) · Insights · Profile | Classic tab bar; (+) opens the quick-log grid |
| Palette | **P1 "Selva"**: forest green + cocona orange on warm cream, with a full green scale so brand, "good" and range zones never look the same | Tarapoto |
| Type | **T2** Bricolage Grotesque (titles, numbers) + Figtree (text) | Modern with character |
| Signature | **S1 + S2**: the month as a woven blanket (Calendar) and the day rings + range rows (Today) | Daylio "Year in Pixels", Andean textiles |
| Motion | **M2** lively: shared transitions, micro-animations on every tap; all disabled with "reduce motion" | Gentler Streak |
| Discarded | N2 timeline as the main screen, S3 minute-by-minute line: users log in one pass with approximate times, not live | Oscar, 2026-10-07 |

## Today screen (also any selected day) — v2, 2026-10-07

Prototype: [explorations/2026-10-07-today-v3.html](explorations/2026-10-07-today-v3.html) (v3 adds portions, hydration, sleep layout)

1. **Header:** date with ‹ › and a date picker; same screen for past days
2. **Day rings (S2, revised):** calories are a range, not a number to fill, so the ring shows two things worth completing:
   - **Outer ring, 6 segments = "day logged":** meals, activity, water, body and mood, sleep, weight. Each segment fills with its colour; the centre shows `4/6`. It feeds the calendar and the "Review my day" button
   - **Inner ring = movement minutes** vs a daily goal (default 30 min, from the WHO 150–300 min/week guideline)
3. **Range rows** for calories, protein, fat and carbohydrates: `label · value · state` on one line (e.g. `Protein  108 g  In range`), then the `red | yellow | green | yellow | red` track with a marker and the **green-zone limits printed small** under its edges. No "108 / 95"
4. **Meals:** four slots; logged items as icon chips with their portion (½ Juane). "+" opens a **search box** on top, the user's **12 most recent dishes** as icon tiles filtered while typing, and a **large "Create dish" button** at the bottom (prefilled with the search text). Choosing a dish asks the **portion**: ¼ ½ ¾ 1 1½ 2 of a serving **or grams**, with the calories updating live; below one serving, an option to **save the rest for tomorrow's breakfast**. Every dish has an icon chosen when it is created
5. **Physical activity:**
   - **"No physical activity"** button = the base day (home, no exercise). Choosing it hides adding; logging any activity clears it
   - **"+ Add activity":** colour icon grid, duration chips, intensity (light / medium / hard), time band
   - **Your routines:** one-tap chips; tapping asks **how much was done** (100 / 75 / 50 / 25%) and when; "Manage" opens the routine editor (name, type, usual duration, exercises with sets × reps)
6. **Hydration:** one entry, two views — a juice logged at breakfast shows its glasses here automatically (badge with the meal); water and zero-calorie drinks are tapped here; tapping a caloric drink here also creates its food entry. Alcohol is shown but does not count. **Urine colour** (clear / yellow / dark) as the main check. Goal = base from sex + climate from the profile; a "**I sweated a lot today**" switch adds 2 glasses. Water from food (20–30%) is not counted
7. **Body and mood**, with colour icons and colour faces: bathroom (Bristol drawings + "gas only" + "didn't go today"), bloating vs usual, **highest stress felt today** (the peak, even if it calmed later), energy, mood
8. **Sleep:** per session: name and hours on one line; "fell asleep → woke up" times side by side; "Sleep quality · Good" over the moons; a "**I had nightmares**" switch; "+ Add nap"
9. **Custom symptoms** and the **private** card (locked)
10. **"Review my day"** jumps to the next incomplete section

## Create dish (F07) — prototype [explorations/2026-10-07-dish-insights-routine.html](explorations/2026-10-07-dish-insights-routine.html)

- One screen, two modes: **Manual (v0.1)** and **With AI (v0.2)**; name, icon picker (12 icons), **yields N servings**
- AI: "Search ingredients" → rows appear one by one; each row = food + source badge (INS / USDA / Label) + amount button (household unit or grams) + kcal + ✕
- Unmatched ingredient: amber row "not in the table" with Search / Ignore; "What's missing?" adds dashed suggested rows with Add / ✕
- Sticky dark-green footer: per-serving kcal, protein, fat, carbohydrates, fibre and iron; "Save dish"

## Insights tab (v0.2)

1. **Your week (F20):** days 🟢 · 🟡 · 🔴, movement minutes / 150, weight trend
2. **Vitamins, minerals and fibre (F19):** one row per nutrient, reds first, value "6.9 of 8.0 mg" + "% · state", track red | yellow | green on a 0–150% scale (sodium: green up to the limit, then yellow, red); grey hatched track for incomplete data. Tap → sheet with the % big, average vs reference, coverage, "where it came from this week", "foods richest in it" with a "you already eat it" badge first, and the caveat

## Routine editor (F18)

- Name, rest between sets, exercise rows (kind icon, "3 × 15 · 4 s/rep · Light", kcal and minutes on the right); tap → sheet with steppers, per-side switch, effort chips and the stopwatch for stairs
- Total "≈ 135 kcal · ≈ 37 min" with an ⓘ table of MET and Compendium code per exercise
- "Log today": 100/75/50/25% or "Adjust per exercise" steppers, time band, kcal preview

## First use and Profile (approved 2026-10-07) — prototype [explorations/2026-10-07-onboarding-profile.html](explorations/2026-10-07-onboarding-profile.html)

- **First use, 6 steps with progress dots:** welcome → account (email + password, "I already have an account") → body (sex, age, height, today's weight with the measuring rule) → goal (lose / maintain, goal weight, weeks; live pace; above 1% of body weight per week a warning with "Use N weeks") → climate and usual sleep (night + optional nap) → what to log (six always-on modules; optional weekly waist with reminder day, own symptoms, intimate life — private: sexual activity and masturbation, explained in the toggle) → daily target (kcal, protein, fat, carbohydrates, movement minutes, ⓘ formula, "not a medical app" and kidney-disease notice)
- **Profile tab:** avatar, email and sync status; **"Your status today" first**: BMI from the weight trend, WHO category in its colour (red < 17 · yellow 17–18.4 · green 18.5–24.9 · yellow 25–29.9 · red ≥ 30), a 15–35 track with "you" marker and 🚩 goal, kg left to the green range, waist-to-height ratio (green < 0.5 · yellow 0.5–0.59 · red ≥ 0.6) and an ⓘ on what BMI does not measure; then the dark-green target card; "You": body, goal, target settings (protein 1.2–2.2 g/kg, fat 20–35%, daily movement minutes), climate, sleep schedule; "Logging": modules, routines, my symptoms; "Your data": export (range, private only if selected, generated offline), about the data (INS, USDA, labels, Compendium, DRI/WHO), sign out

## Time entry rule

Nobody logs minute by minute. Every entry defaults to a **time band** (early morning, morning, midday, afternoon,
evening, night) taken from when it is logged or from its slot; an exact time is optional. Sleep prefills from the
user's usual schedule.

## Range thresholds

Approved 2026-10-07; implemented in `packages/core` `day/range-state`.

| Metric | Green | Yellow | Red |
| --- | --- | --- | --- |
| Calories | 90–110% of target | 80–90% · 110–120% | < 80% · > 120% |
| Protein | 90–130% | 70–90% · 130–160% | < 70% · > 160% |
| Fat, carbohydrates | 80–120% | 65–80% · 120–135% | < 65% · > 135% |

While the day is still open, values below green read **"N left"** in a neutral colour; only overshooting shows
yellow or red.

## Activity logging

| Level | What the user enters | Release |
| --- | --- | --- |
| Base | "No physical activity" (exclusive) | v0.1 |
| 1 | Type + duration + intensity (light "you can talk" · medium "broken sentences" · hard "can barely talk") + time band; the extra kcal is shown before saving with an ⓘ explaining the formula | v0.1 |
| 2 | Own routines, editable, logged with % completed | v0.1 |
| 3 | Optional sets × reps × weight per session for strength progress (not calories) | v0.3 |

## Calendar (S1)

Prototype: [explorations/2026-10-07-calendar.html](explorations/2026-10-07-calendar.html)


Month grid styled as a woven blanket: each day is a band coloured by its result (green 400 + check, amber + dot,
red + cross, grey = no data). Below it, a monthly chart: calories per day against the target line, switchable to
weight trend, weekly waist (if enabled), drinks and bloating.

- Each day cell: woven texture, day number, and a status mark (check / dot / cross) so colour is never alone; today has an accent dot; future days are dashed outlines
- Month counters under the blanket: good · almost · out of range · no data
- Tapping a day opens a summary card (calories and protein with their zone, activity, drinks, bloating) and "Open this day"
- Monthly chart, one metric at a time (chips): bars for calories, protein, movement and drinks, coloured dark green when inside **that day's** range; dots + trend line (moving average) for weight and waist; hover/tap tooltip per day

## Change history

- 2026-10-07 — First direction chosen by Oscar
- 2026-10-07 — Caloric drinks live in meals and count toward hydration automatically; waist becomes weekly and optional
- 2026-10-07 — Calendar prototype; phase 4 closed by Oscar
- 2026-10-07 — Today v3: dish search + 12 recent + portions in fractions or grams + leftovers; hydration by drink type + urine colour + climate from profile; sleep layout; activity kcal explained
- 2026-10-07 — Today v2 after Oscar's review: ring no longer shows calories (now "day logged" + movement minutes); range rows show value + state and green limits; icons on every dish; "No physical activity" replaces the unconfirmed default; editable routines with % done; colour faces; stress = peak of the day; editable sleep times
- 2026-10-07 — Create dish, Insights (F19, F20) and per-exercise routine editor approved
- 2026-10-07 — First use and Profile proposed
- 2026-10-07 — First use and Profile approved with "Your status today" (BMI + waist-to-height); design closed
