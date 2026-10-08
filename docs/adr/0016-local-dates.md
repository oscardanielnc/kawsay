# 0016. Days are local calendar days from the phone's time zone

- Status: Accepted
- Date: 2026-10-07

## Context

A dinner logged at 22:00 in Lima (UTC−5) is 03:00 UTC of the next day. Targets, the calendar colour, the weight
trend and recalibration all group entries by day, so the day must be the user's day.

## Options considered

- Store UTC only and derive the day on read: the API and the phone could disagree, and travel rewrites history
- Fixed offset in the profile (UTC−5): breaks on travel and in zones with daylight saving
- **The phone's IANA time zone at the moment of logging**

## Decision

- Every dated entry stores `date` (`YYYY-MM-DD`, computed on the phone with `core` `localDateOf`), the UTC instant
  and the IANA `timeZone` it was logged in
- The time zone comes from the device (`expo-localization`, fallback `Intl.DateTimeFormat().resolvedOptions()`)
- The API never derives a day from a UTC timestamp; it groups by the stored `date`
- `core` works on `LocalDate` strings; day arithmetic uses `Date.UTC`, so DST never makes a day 23 or 25 hours
- "Today" = `localDateOf(clock.now(), deviceTimeZone)`; the clock is injected

## Consequences

- An entry keeps the day it was logged under, even after travelling
- Hermes must support `Intl.DateTimeFormat` with `timeZone`: verify on a device when `apps/mobile` is scaffolded
- Not decided: a "day ends at" setting for meals after midnight; proposed later if needed
