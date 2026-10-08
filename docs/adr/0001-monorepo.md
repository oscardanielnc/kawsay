# 0001. Monorepo: Expo app, NestJS API and shared core

- Status: Accepted
- Date: 2026-10-07

## Context

The phone must compute targets offline and the API must compute the same values for insights. Both share sync payloads.

## Options considered

- Two repositories + OpenAPI codegen: duplicated business rules
- **Monorepo with Turborepo + pnpm**: `apps/mobile`, `apps/api`, `packages/core`, `packages/contracts`, `packages/ui`, `packages/config`

## Decision

Monorepo, same toolchain as payment-orchestrator. `packages/core` holds pure rules used by both apps.

## Consequences

- A rule changes in one place and both apps rebuild against it
- Expo inside a pnpm monorepo needs Metro workspace config at scaffold time
