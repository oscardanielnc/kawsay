#!/usr/bin/env bash
# Deploys the API to the Oracle VM (ADR 0011, runbook docs/runbooks/deploy.md).
#
#   ./deploy/deploy.sh <user@vm> [prod|dev]
#
# Ships the committed API sources (never the working tree), builds the image on the VM, applies migrations on
# start and waits for /v1/health. Idempotent: run it again for every release.
set -euo pipefail

TARGET="${1:?usage: deploy.sh <user@vm> [prod|dev]}"
ENVIRONMENT="${2:-prod}"
case "$ENVIRONMENT" in
  prod) PORT=3100 ;;
  dev) PORT=3101 ;;
  *) echo "environment must be prod or dev" >&2; exit 1 ;;
esac

cd "$(dirname "${BASH_SOURCE[0]}")/.."
if ! git diff --quiet HEAD -- apps/api packages/contracts packages/config deploy; then
  echo "Uncommitted API changes: commit first, the VM only gets what is committed." >&2
  exit 1
fi

echo "==> Shipping $(git rev-parse --short HEAD) to $TARGET:~/kawsay"
git archive --format=tar HEAD \
  package.json pnpm-lock.yaml pnpm-workspace.yaml .dockerignore \
  packages/config packages/contracts apps/api deploy \
  | ssh "$TARGET" 'mkdir -p ~/kawsay && tar -xf - -C ~/kawsay'

echo "==> Building and starting kawsay-$ENVIRONMENT on 127.0.0.1:$PORT"
ssh "$TARGET" ENVIRONMENT="$ENVIRONMENT" PORT="$PORT" 'bash -s' <<'REMOTE'
set -euo pipefail
cd ~/kawsay
ENV_FILE="deploy/$ENVIRONMENT.env"
if [ ! -f "$ENV_FILE" ]; then
  # Secrets are born on the VM and never leave it.
  umask 077
  {
    echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=')"
    echo "JWT_ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '/+=')"
    echo "API_PORT=$PORT"
  } > "$ENV_FILE"
  echo "    created $ENV_FILE with new secrets"
fi
docker compose -p "kawsay-$ENVIRONMENT" --env-file "$ENV_FILE" -f deploy/compose.yml up -d --build
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/v1/health" >/dev/null; then
    echo "    healthy"
    exit 0
  fi
  sleep 2
done
echo "API did not become healthy; last logs:" >&2
docker compose -p "kawsay-$ENVIRONMENT" --env-file "$ENV_FILE" -f deploy/compose.yml logs --tail 40 api >&2
exit 1
REMOTE

echo "==> Done. Public check: curl https://kawsay$([ "$ENVIRONMENT" = dev ] && echo -dev).oscarnavarro.dev/v1/health"
