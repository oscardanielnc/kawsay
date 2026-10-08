# F17. On-demand insights

- Release: later (deferred 2026-10-07)
- Status: Approved 2026-10-07

## What

Ask the app what lines up with your symptoms.

## Rules

- The API compares days with X vs without X (foods, activities, sleep, stress, intimate) against symptoms on the same day and up to 48 h later, against the user's own baseline
- Minimum data: 3 occurrences and 10 days before showing a relation
- The AI receives aggregates only and writes findings and habit suggestions with a confidence level
- Always states it is not a diagnosis and lists warning signs that need a doctor

## Acceptance criteria

- [ ] With seeded data where dairy raises bloating, the insight reports it
