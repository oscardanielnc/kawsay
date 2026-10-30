# F13. Custom symptoms

- Release: v0.1
- Status: Approved 2026-10-07

## What

Users create the symptoms they care about.

## Rules

- Name + type: yes/no, 0–5, or size
- Custom symptoms join the insights like any other signal
- **Marked every day the symptom is present** (owner, 2026-10-30): consecutive days form an episode. From day 2 the
  card asks "Still have X today?" (Yes, still · It's gone), one tap
- Insights use the episode's first day to look for triggers and its length to look for what makes it last longer

## Acceptance criteria

- [x] Creating a symptom takes less than 30 seconds
- [x] A symptom marked 10 days in a row shows as one episode of 10 days

## Build notes

- 2026-10-30: episodes are `@kawsay/core/insights/symptom-episodes`. Today asks "¿Sigues con X hoy?" for every
  symptom present yesterday (any answer but "0"); "Sí, sigue" repeats yesterday's answer. Insights keep an own
  symptom only on each episode's first day; the following days are left out of both sides of the comparison
