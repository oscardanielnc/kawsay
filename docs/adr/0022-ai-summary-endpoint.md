# 0022. The short AI summary is a new endpoint; the old analysis keeps answering

- Status: Accepted (plan M7)
- Date: 2026-10-30

## Context

F17's redesign trims the AI answer from ~11,000 to ~1,500 characters with tagged findings. Phones update by OTA a
little after the API is deployed, so for a while old apps still call `POST /v1/insights/analyze` and expect the
long `Analysis`.

## Options considered

- Change `Analysis` in place: old apps fail to parse the new shape until they update
- A `version` field in the request: one endpoint with two outputs, harder to read and to test
- **A new endpoint `POST /v1/insights/summary` with its own contract (`Summary`)**: chosen

## Decision

- `Summary`: summary ≤ 220 · findings ≤ 3 `{ tag, title ≤ 60, detail ≤ 140, confidence }` · habits ≤ 2 (≤ 80) ·
  warning signs ≤ 3. Same request (`AnalysisRequest`), same daily limit (3 per rolling 24 h, shared)
- The AI port gets `summarize()` with its own Spanish prompt; invalid output is asked again once, as before
- `/insights/analyze` stays until no phone runs an app older than this release; then it goes with its prompt

## Consequences

- Deploy order: API first (both endpoints answer), then the app update
- The phone stores the last summary; an old stored analysis reads as "never updated" and the card suggests one
