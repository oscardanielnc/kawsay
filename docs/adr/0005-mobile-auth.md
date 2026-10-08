# 0005. Mobile authentication: secure-store refresh token

- Status: Accepted
- Date: 2026-10-07

## Context

The standard stores the refresh token in an `httpOnly` cookie. A native app has no browser cookie jar worth relying on.

## Decision

Same design as payment-orchestrator ADR 0011 (argon2id, 15-min HS256 access JWT, rotating opaque refresh tokens
in session families with reuse detection), except: **the refresh token lives in `expo-secure-store`**
(Android Keystore-backed), the access token only in memory. The app lock for the intimate log uses
`expo-local-authentication`.

## Consequences

- Documented exception to the standard's cookie rule, valid for native clients only
