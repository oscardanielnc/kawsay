# 0006. Spanish UI through i18n from day one

- Status: Accepted
- Date: 2026-10-07

## Context

The standard says user-facing text is English. Kawsay's first users speak Spanish.

## Decision

- All user-facing strings go through i18next (`react-i18next`), keys in English, `es` as default locale
- Code, docs, commits and keys stay English
- Dates and numbers formatted per locale (`Intl`)

## Consequences

- Adding a language later = adding a translation file
- Hard-coded UI strings fail lint
