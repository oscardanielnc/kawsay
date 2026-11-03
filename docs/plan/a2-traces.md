# A2. Traces and cost per entry

Goal: know what each logged entry costs, how long it takes and how often the proposal is accepted as is.

## Before starting

- ADR 0024 is Accepted: Langfuse Cloud, EU (`https://cloud.langfuse.com`), project "kawsay", masked content. The keys
  are in the local environment (plan README, continuous mode)
- `deploy/deploy.sh` gets one change: if `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` and `LANGFUSE_BASE_URL` exist
  locally and the VM env file lacks them, it appends them without echoing; `compose.yml` passes them to the API
  (optional, like `DEEPSEEK_API_KEY`). Spans carry the environment (dev or prod)

## Steps

1. Cost per call from the price config; $ per entry = cost ÷ confirmed entries; acceptance rate = proposals saved
   without edits
2. Langfuse JS SDK (OpenTelemetry based) with a masking function: production spans carry numbers, never text. Off
   when the keys are missing. Test that a masked span contains no input or output text
3. Admin CLI like `create-user`: `ai-stats` prints the last 7 and 30 days (calls, $ per entry, p50/p95, acceptance)
4. Delete input text older than 90 days (a daily timer in the API; no queue needed)

## Done when

- [x] The CLI prints real numbers on dev; a dev trace shows in Langfuse with masked content (check it with the
      Langfuse public API, not by printing keys)
