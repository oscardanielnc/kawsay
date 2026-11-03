# A4. Guardrails

Goal: the controls of ADR 0026, each with a test.

## Steps

1. Caps per user: 30 text logs per rolling 24 h and USD 0.10 a day, checked from `ai_call`; above them "vuelve mañana"
2. Drop unknown catalog ids; reject over-long text; wrap user text as data in the prompt
3. Golden-set injection and prompt-leak cases pass; add a unit test for each control
4. `docs/security/llm-threats.md`: OWASP Top 10 for LLM Applications 2025 → which items apply (LLM01, 02, 05, 06, 07,
   10), the control and the test for each; the rest marked "not applicable" with one line why

## Done when

- [ ] Every applicable OWASP item has a control and a passing test; the evals still meet the baseline
