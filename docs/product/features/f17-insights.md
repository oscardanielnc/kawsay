# F17. On-demand insights

- Release: v0.1 (relations on the phone + AI analysis on demand, 2026-10-12)
- Status: Approved 2026-10-07

## What

Ask the app what lines up with your symptoms.

## Rules

- The phone compares days with X vs without X (foods and their ingredients, drinks, added sugar, sleep, activity) against bad symptom days on the same day and up to 48 h later, against the user's own baseline (ADR 0019). Intimate entries are left out
- Minimum data: 5 occurrences and 10 days before showing a relation
- **Chance is ruled out (owner, 2026-11-07):** real use showed coincidences as relations (a fruit eaten most days, a
  garnish never eaten on purpose). Each pair now passes a two-sided Fisher exact test and Benjamini–Hochberg correction
  over every pair tested; only q ≤ 0.1 is shown (about one coincidence in ten at most). Confidence comes from q:
  high ≤ 0.01 with 8+ occurrences, medium ≤ 0.05. A dish's ingredient counts as eaten only from 25 g eaten
  (a garnish does not). Exposed days overlap through the 48 h window, so the test is a filter, not a proof
- **Which pairs are compared (owner, 2026-11-04):** foods and dishes only against gut symptoms (bloating,
  diarrhoea, constipation, and own symptoms named like one: "Gases", "Acidez"). Mood, stress, energy, sleep and
  any other own symptom (mouth ulcers) only against day tags: short or poor sleep, 2 h+ of motorbike, hard
  activity, activity or none, alcohol, coffee or tea, a high added-sugar day. Testing hundreds of foods against mood
  only found coincidences ("culantro, less stress"). What happened in the day reaches the AI through the notes
- The AI prompts say mood, stress, energy, sleep and recurrent mouth ulcers follow rest, the day's load and its
  events, never a food
- Without AI the card lists the relations found, each with its counts and a confidence level (low · medium · high)
- "Analizar con IA" sends those relations (in words, with their counts), the week, the nutrients below reference and the day notes of the six weeks (ADR 0019); the AI (DeepSeek `deepseek-flash`, ADR 0007) answers a summary, findings with confidence and source (data · notes · both), habits to try and warning signs
- 3 analyses per rolling 24 h per user (`AI_DAILY_LIMIT`); only successful ones count; the server stores only their time
- The latest analysis stays on the phone (not synced)
- Always states it is not a diagnosis and lists warning signs that need a doctor
- **Redesign approved by the owner 2026-10-30** (the answer could reach ~11,000 characters):
  - **Only on demand:** an "Update summary" button is the only thing that calls the AI. Never automatic
  - Shows the date of the last update and **suggests updating** when 7 days have passed or 4 new days were logged,
    or a new symptom episode started; otherwise "Up to date"
  - Output trimmed (contract change): summary ≤ 220 characters · up to 3 findings, each a coloured tag (food, sleep,
    stress, activity, symptom), a title ≤ 60, one line ≤ 140 and a confidence (three dots) · up to 2 habits ≤ 80 ·
    warning signs only when there are any (≤ 3). About 1,500 characters at most
  - Prototype: the owner's design canvas "Kawsay — Hoy rediseñado", Analysis board

## Acceptance criteria

- [x] With seeded data where dairy raises bloating, the insight reports it
- [x] Fewer than 10 logged days asks for more; an exposure seen fewer than 5 times is never a finding
- [x] A 4th analysis within 24 h is refused with "vuelve mañana"; a failed AI call does not count
- [x] Invalid AI output is retried once, then a clear error
- [x] The request carries no identifiers and no intimate entries (the contract refuses extra fields)
- [x] A food is never compared with mood, stress, energy or sleep: "culantro, less stress" cannot appear
- [x] Mouth ulcers after long motorbike days relate to the motorbike, never to what was eaten those days
- [x] 60 foods eaten at random against random constipation over 42 days show no relation
- [x] A garnish of 10 g in a 350 g causa is not counted as eaten
