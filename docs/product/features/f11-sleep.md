# F11. Sleep

- Release: v0.1
- Status: Approved 2026-10-07

## What

Several sleep sessions per day.

## Rules

- Sessions prefill from the usual schedule; start and end are editable
- Each session: start, end, quality 1–5 (labelled "Sleep quality" with words: very poor … excellent), nightmares yes/no
- Naps can be added or removed
- Night and naps add up per day, never more than 24 h
- A night that starts from noon on and ends earlier on the clock crossed midnight (23:00 → 07:00 is 8 h). A nap
  never crosses midnight, and neither does a night that starts in the morning: an end before the start there is a
  time still being entered, so it counts 0 h and the session says why until it is fixed

- **Target (ADR 0020):** the week's average per day (night + naps) 7–9 h blue · 6–7 or 9–10 h amber · < 6 or > 10 h
  coral; shown in the Liver card (F25). Days without a sleep log are left out of the average

## Acceptance criteria

- [x] A night plus a nap show the daily total
- [x] A nap 14:00 → 13:30 counts 0 hours, and the day still opens
- [x] Changing the prefilled nap's time with several quick taps leaves one nap
- [ ] A week averaging 6 h 40 shows amber

## Build notes

- 2026-10-30 bug (owner): editing the prefilled nap created a second one. The draft has no id until its first save
  finishes, so each quick tap inserts a new nap (the night already dedupes; naps do not). Fix: the draft gets its id
  when shown and every save upserts by id; a new nap only comes from "Add nap"
