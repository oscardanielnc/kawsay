# 0003. Hexagonal API modules, feature folders on mobile

- Status: Accepted
- Date: 2026-10-07

## Decision

- API: the standard's four layers per module, abstract-class ports, mappers at every boundary
- Mobile: `src/features/<feature>/` (screens, components, hooks, db queries), `src/components/` shared by role,
  `src/lib/` (db, sync, i18n). Promotion rule and import rules as in the standard, enforced by lint
- Business rules that must run offline live in `packages/core`, never inside screens

## Consequences

- Screens stay thin: read local DB → call `core` → render
