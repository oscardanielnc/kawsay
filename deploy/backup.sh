#!/usr/bin/env bash
# Nightly encrypted backup of one environment's Postgres (ADR 0011). Runs on the VM from cron:
#
#   15 3 * * * ~/kawsay/deploy/backup.sh prod >> ~/kawsay-backups/backup.log 2>&1
#
# The dump is encrypted with `age` for a public key whose private half never touches the VM, so a stolen backup
# or VM exposes no health data. Keeps 30 days. Restore: docs/runbooks/backup-restore.md.
set -euo pipefail

ENVIRONMENT="${1:-prod}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."
RECIPIENT_FILE="deploy/backup-recipient.txt"
DEST="$HOME/kawsay-backups/$ENVIRONMENT"
[ -s "$RECIPIENT_FILE" ] || { echo "missing $RECIPIENT_FILE (age public key)" >&2; exit 1; }
mkdir -p "$DEST"

FILE="$DEST/kawsay-$ENVIRONMENT-$(date -u +%Y%m%dT%H%M%SZ).dump.age"
docker compose -p "kawsay-$ENVIRONMENT" --env-file "deploy/$ENVIRONMENT.env" -f deploy/compose.yml \
  exec -T postgres pg_dump -U kawsay -d kawsay --format=custom \
  | age --recipients-file "$RECIPIENT_FILE" > "$FILE.partial"
mv "$FILE.partial" "$FILE"
find "$DEST" -name '*.dump.age' -mtime +30 -delete
echo "$(date -u +%FT%TZ) backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
