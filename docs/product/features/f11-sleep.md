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

## Acceptance criteria

- [x] A night plus a nap show the daily total
- [x] A nap 14:00 → 13:30 counts 0 hours, and the day still opens
