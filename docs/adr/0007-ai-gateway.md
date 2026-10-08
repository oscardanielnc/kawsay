# 0007. AI behind a port, DeepSeek as first adapter

- Status: Accepted
- Date: 2026-10-07

## Context

AI is used to parse free text, decompose dishes, pick METs and explain insights. The author chose DeepSeek
(cheap, already used). Its privacy policy states data is stored in China.

## Decision

- The phone never calls the AI; only the API does, through `AiPort` (one method per use case)
- First adapter: DeepSeek `deepseek-flash` over its OpenAI-compatible API with JSON output
- Every AI response is validated with a Zod schema; invalid output = retry once, then a clear error
- **Data minimisation:** send only the text needed for the task, no user identifiers, aggregates for insights,
  **never intimate entries**
- AI output is a proposal; nothing is stored without user confirmation

## Consequences

- Changing provider = one new adapter
- Revisit the provider before public release (data residency for health data)
