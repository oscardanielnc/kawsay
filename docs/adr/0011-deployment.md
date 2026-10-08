# 0011. API on the Oracle VM with Docker Compose

- Status: Accepted
- Date: 2026-10-07

## Decision

- API + Postgres on the existing Oracle Cloud VM, Docker Compose, exposed through Cloudflare Tunnel
- Domain: `kawsay.oscarnavarro.dev` (API under `/v1`) until a public name is chosen
- Two environments with separate databases: `dev` and `prod`
- Nightly encrypted Postgres backups; restore runbook written before real data is stored

## Consequences

- The author's personal data lives on infrastructure he controls
