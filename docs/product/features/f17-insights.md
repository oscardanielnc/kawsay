# F17. On-demand insights

- Release: v0.1 relations without AI (2026-10-12) · AI wording later
- Status: Approved 2026-10-07

## What

Ask the app what lines up with your symptoms.

## Rules

- The phone compares days with X vs without X (foods and their ingredients, drinks, added sugar, sleep, activity) against bad symptom days on the same day and up to 48 h later, against the user's own baseline (ADR 0019). Intimate entries are left out
- Minimum data: 3 occurrences and 10 days before showing a relation
- Without AI the card lists the relations found, each with its counts and a confidence level (low · medium · high)
- The AI (later) receives those aggregates plus the day notes of the window, only when the user taps "Analizar" (ADR 0019), and writes findings and habit suggestions
- Always states it is not a diagnosis and lists warning signs that need a doctor

## Acceptance criteria

- [x] With seeded data where dairy raises bloating, the insight reports it
- [x] Fewer than 10 logged days asks for more; an exposure seen fewer than 3 times is never a finding
