# 0012. Toolchain versions and mobile test runner

- Status: Accepted
- Date: 2026-10-07

## Decision

- Shared toolchain as payment-orchestrator ADR 0013: Node 24 LTS, pnpm, Turborepo 2, TypeScript 6.0, Zod 4,
  NestJS 11, Prisma 7, Vitest for `core`, `contracts` and `api`
- **Mobile tests: Jest with `jest-expo` + React Native Testing Library**, the Expo-supported setup; Vitest does
  not run React Native components reliably
- E2E on mobile deferred to v0.2 (Maestro candidate)
- Local database: Drizzle ORM 0.45 stable (1.0 still a release candidate on 2026-10-08) over `expo-sqlite`.
  Query tests run the bundled `.sql` migrations on Node 24's built-in `node:sqlite` through Drizzle's
  `sqlite-proxy`: real SQLite, no native test dependency
- Dependencies younger than pnpm's minimum release age are not installed; no exceptions

## Consequences

- Two test runners in one repo; `vi.fn` ↔ `jest.fn` are near-identical
- Documented exception to "Vitest everywhere"
