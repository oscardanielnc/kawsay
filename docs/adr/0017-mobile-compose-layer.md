# 0017. A compose layer for what spans features on mobile

- Status: Accepted
- Date: 2026-10-08

## Context

Features never import each other (ADR 0003). A day's targets, ring and colour need meals, activity, sleep,
hydration, check-ins, weight and profile together, and both Today and Calendar need them. Kept in the routes, the
same composition would be written twice; kept in a feature, it breaks the boundary.

## Options considered

- Duplicate the composition in each route: two places to fix, and Calendar colours could drift from Today
- A "day" feature allowed to import the others: an exception that weakens the rule for every feature
- **A `src/compose/` layer:** routes → compose → features → shared, enforced by lint

## Decision

- `src/compose/` holds read-and-combine code that spans features (`day.ts`: load a day, compute its targets,
  ring and colour). It has no screens and no writes
- It may import features and shared code; features and shared code may not import it

## Consequences

- Today and Calendar compute a day the same way by construction
- The rule stays simple: a feature still sees only itself and shared code
