# F21. Day notes

- Release: v0.1
- Status: Approved 2026-10-12 (requested by Oscar)

## What

Free notes about the day that matter for health or emotional wellbeing: a fight and how it ended, how the belly
felt after the bathroom, a food that seemed to cause diarrhoea.

## Rules

- A day can have any number of notes; each keeps the time it was written and can be edited or deleted
- Up to 4,000 characters per note; empty notes are not saved
- The text box sits above the keyboard and grows with the text: what is being written is always visible
- Notes sync like any other entry and go into the export (`notes.csv` and the JSON), so an external AI can read them
- Not part of any total, ring or colour
- On-demand insights (F17) may read notes only when the user asks for an analysis; never in the background

## Acceptance criteria

- [ ] Writing "Tuve una pelea con mi novia pero a los pocos minutos nos reconciliamos" saves a note on that day
- [ ] Editing a note keeps one note with the new text; deleting it removes it from the day
- [ ] A blank note cannot be saved
- [ ] The export has a notes.csv with date, time and text
