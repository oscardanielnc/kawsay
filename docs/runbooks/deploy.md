# Runbook: deploy the API

API + Postgres on the Oracle VM, one Docker Compose project per environment, published only on loopback and
exposed through Cloudflare Tunnel (ADR 0011).

| Environment | Compose project | Loopback port | Public URL | App variant |
| --- | --- | --- | --- | --- |
| prod | `kawsay-prod` | 3100 | `https://kawsay.oscarnavarro.dev/v1` | Kawsay |
| dev | `kawsay-dev` | 3101 | `https://kawsay-dev.oscarnavarro.dev/v1` | Kawsay Dev |

Live since 2026-10-09 on the shared Oracle VM (ARM64, Oracle Linux 9), both environments, tunnel hostnames, nightly
prod backup at 03:15 UTC (restore tested).

## Release

```bash
DEPLOY_SSH_KEY=~/sentinel-prod.key ./deploy/deploy.sh opc@<vm-ip> prod    # or dev
```

Ships the committed sources with `git archive`, builds on the VM, applies migrations on start, waits for
`/v1/health`. The first run creates `deploy/<env>.env` on the VM with random secrets; they never leave it.

## Publishing catalog dishes (F23 piece 5)

Change `packages/catalog/seed/generated/estimated-dishes.json` (or re-run `node scripts/generate-recipes.ts`), run
`pnpm --filter @kawsay/catalog build`, commit `packages/catalog/remote/` and deploy the API. Phones pull the new list
after their next sync; no app update.

## First time only

1. **Tunnel:** in Cloudflare Zero Trust → Networks → Tunnels → the VM's tunnel → Public hostnames, add
   `kawsay.oscarnavarro.dev` → `http://localhost:3100` and `kawsay-dev.oscarnavarro.dev` → `http://localhost:3101`
   (or the same two `ingress` rules in `/etc/cloudflared/config.yml`, then `sudo systemctl restart cloudflared`)
2. **Account** (the app has no sign-up, ADR 0018); prints a generated password once:
   ```bash
   ssh <user@vm> 'cd ~/kawsay && docker compose -p kawsay-prod --env-file deploy/prod.env -f deploy/compose.yml \
     exec -T api node dist/modules/identity/presentation/cli/create-user.cli.js <email>'
   ```
3. **Backups:** follow [backup-restore.md](backup-restore.md) and run one restore before storing real data

## New password for an account

No reset by email yet. On the VM, typed by the account owner (the password never goes in an argument or the history);
it also closes that account's open sessions, so the phone asks to sign in again:

```bash
cd ~/kawsay && read -s -p "Nueva contraseña (12+ caracteres): " p && echo && printf '%s' "$p" |   docker compose -p kawsay-prod --env-file deploy/prod.env -f deploy/compose.yml   exec -T api node dist/modules/identity/presentation/cli/set-password.cli.js <email>; unset p
```

## Checks

- `curl https://kawsay.oscarnavarro.dev/v1/health` → `{"status":"ok"}`
- `ss -ltnp | grep 310` on the VM shows only `127.0.0.1` listeners
- Logs: `docker compose -p kawsay-prod --env-file deploy/prod.env -f deploy/compose.yml logs -f api`
  (they never contain health data: errors are logged by name and code only, ADR 0013)

## AI numbers (ADR 0024)

```bash
cd ~/kawsay && docker compose -p kawsay-prod --env-file deploy/prod.env -f deploy/compose.yml   exec -T api node dist/modules/text-log/presentation/cli/ai-stats.cli.js
```

Calls, cost, $ per saved entry, p50/p95 and acceptance for the last 7 and 30 days. Traces: Langfuse Cloud (EU),
project "kawsay", masked content; `deploy.sh` copies the Langfuse keys from the local environment once.

## Hardening (why the compose file looks like that)

Loopback-only port, read-only root filesystem, `no-new-privileges`, no capabilities, `noexec` tmpfs and memory, CPU
and PID ceilings: each one breaks a step of the August 2026 incident on this VM (see exposure-dashboard's
SECURITY.md).
