# 0024. AI traces and cost: own table first, Langfuse Cloud with masked content

- Status: Accepted (owner, 2026-10-31: he first chose Langfuse on the VM, then this cloud option after the sizing)
- Date: 2026-10-31

## Context

The plan needs tokens, latency p50/p95 and dollars per logged entry. Self-hosted Langfuse v3 runs web, worker,
Postgres, ClickHouse, Redis and blob storage; its documented minimums add up to about 11 CPU and 25 GiB of RAM
(ClickHouse alone 8 GiB). The shared Oracle VM gives the API 384 MB. ADR 0013: no health data in logs or analytics.

## Options considered

- Langfuse self-hosted on the VM: too heavy for the shared VM. Discarded
- Arize Phoenix self-hosted (one container, 1–4 GB, Elastic License 2.0): lighter, still a new service to run and back up
- **Own `ai_call` table + Langfuse Cloud Hobby (free: 50k units a month, 30 days of history, EU region) with
  client-side masking**: chosen
- Only the own table: enough for numbers, no trace viewer

## Decision

- `ai_call` in the API Postgres: use case, model, prompt version, tokens in / cached / out, latency, cost (prices per
  model in config, with the date they were checked), outcome (ok · invalid · error), tool rounds, proposal and final
  entries. The input text is kept 90 days for the owner's review, then deleted
- Langfuse gets the same numbers per span, **with input and output masked in production**: no meal text leaves the VM
  except to the AI provider. Eval runs, with synthetic data only, send full content
- OpenTelemetry GenAI attribute names, so another backend is one exporter away
- Langfuse keys live only in the VM env file; without them tracing is off and nothing else changes
- An admin CLI prints the last 7 and 30 days: calls, $ per entry, p50/p95, acceptance rate

## Consequences

- Dashboards without new infrastructure; the owner creates the Langfuse account (an agent cannot create accounts)
