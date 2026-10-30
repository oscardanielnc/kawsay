# F17. On-demand insights

- Release: v0.1 (relations on the phone + AI analysis on demand, 2026-10-12)
- Status: Approved 2026-10-07

## What

Ask the app what lines up with your symptoms.

## Rules

- The phone compares days with X vs without X (foods and their ingredients, drinks, added sugar, sleep, activity) against bad symptom days on the same day and up to 48 h later, against the user's own baseline (ADR 0019). Intimate entries are left out
- Minimum data: 3 occurrences and 10 days before showing a relation
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
- [x] Fewer than 10 logged days asks for more; an exposure seen fewer than 3 times is never a finding
- [x] A 4th analysis within 24 h is refused with "vuelve mañana"; a failed AI call does not count
- [x] Invalid AI output is retried once, then a clear error
- [x] The request carries no identifiers and no intimate entries (the contract refuses extra fields)
