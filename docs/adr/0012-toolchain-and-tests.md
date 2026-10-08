# 0012. Toolchain versions and mobile test runner

- Status: Accepted
- Date: 2026-10-07

## Decision

- Shared toolchain as payment-orchestrator ADR 0013: Node 24 LTS, pnpm, Turborepo 2, TypeScript 6.0, Zod 4,
  NestJS 11, Prisma 7, Vitest for `core`, `contracts` and `api`
- **Mobile tests: Jest with `jest-expo` + React Native Testing Library**, the Expo-supported setup; Vitest does
  not run React Native components reliably
- E2E on mobile deferred to v0.2 (Maestro candidate)

## Consequences

- Two test runners in one repo; `vi.fn` ↔ `jest.fn` are near-identical
- Documented exception to "Vitest everywhere"
