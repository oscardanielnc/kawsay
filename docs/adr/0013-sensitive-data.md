# 0013. Sensitive data handling

- Status: Accepted
- Date: 2026-10-07

## Decision

- Health and intimate data are never written to logs, error trackers or analytics
- Intimate entries: hidden behind the app lock, excluded from AI calls and from exports unless selected
- Fixtures and seed data are synthetic; no real user data in the repository
- Before public release: explicit consent screen, privacy policy, Google Play health declaration, Peruvian
  personal data law (Ley 29733) review

## Consequences

- A test asserts that the AI gateway rejects payloads containing intimate entries
