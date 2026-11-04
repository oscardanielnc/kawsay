# F11. Sleep

- Release: v0.1
- Status: Approved 2026-10-07

## What

Several sleep sessions per day.

## Rules

- Sessions prefill from the usual schedule; start and end are editable in two taps: tap the time, then its hour
  (00–23) and its minutes (:00 :15 :30 :45). No −/+ steppers for times
- Each session: start, end, quality 1–5 (labelled "Sleep quality" with words: very poor … excellent), nightmares yes/no
- Naps can be added or removed; they keep the order they were added in, so editing one never moves it
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
- [x] A week averaging 6 h 40 shows amber
- [x] A time moves from 13:00 to 08:00 with one tap on its hour, not twenty taps on minus
- [x] Naps keep the order they were added in, even when a later one starts earlier

## Build notes

- 2026-10-30 bug (owner): editing the prefilled nap created a second one. The draft has no id until its first save
  finishes, so each quick tap inserts a new nap (the night already dedupes; naps do not). Fix: the draft gets its id
  when shown and every save upserts by id; a new nap only comes from "Add nap"
- 2026-11-04 (owner): moving 13:00 to 08:00 with −/+ took two minutes, so times use `TimeField` (hour grid +
  minute chips, pure JS, no new APK); the profile's usual schedule uses it too. A third nap jumped to second
  place because naps were sorted by start; they are sorted by id now (UUIDv7, creation order)
