# 0026. Guardrails for the text agent

- Status: Accepted (owner, 2026-10-31)
- Date: 2026-10-31

## Context

The user's text is untrusted input to a model that calls tools. OWASP Top 10 for LLM Applications 2025 lists prompt
injection first (LLM01), with excessive agency (LLM06) and unbounded consumption (LLM10).

## Decision

- The model can only read: its tools search the catalog and read units. Saving happens on the phone after confirmation
- Tool arguments and the proposal are validated with Zod; unknown catalog ids are dropped and reported as unmatched
- The proposal has no nutrient, calorie or instruction field, so a manipulated answer cannot change a number
- Text ≤ 300 characters, wrapped as data in the prompt; injection and system-prompt-leak attempts are in the golden set
- Per user: 30 text logs per rolling 24 h and a daily cost ceiling of USD 0.10, on top of the throttler; above them
  "vuelve mañana"
- The request carries no identifiers, no intimate entries and no journal data; a test asserts the body
- Errors are logged by name and code only (ADR 0013)
- `docs/security/llm-threats.md` maps each OWASP item to its control and test

## Consequences

- The worst case of an injection is a wrong proposal, which the user sees before saving
