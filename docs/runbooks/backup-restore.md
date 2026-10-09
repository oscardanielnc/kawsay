# Runbook: backups and restore

Nightly `pg_dump` per environment, encrypted with [age](https://age-encryption.org) for a key whose private half
lives only on the owner's computer (ADR 0011). 30 days are kept on the VM.

## Set up (once)

1. On your computer: `age-keygen -o kawsay-backup.key` (Windows: `winget install FiloSottile.age`). Keep the file in
   your password manager; without it no backup can be read
2. Copy the `# public key: age1…` value into `~/kawsay/deploy/backup-recipient.txt` on the VM
3. On the VM: `sudo apt install -y age`, then `crontab -e` and add
   `15 3 * * * ~/kawsay/deploy/backup.sh prod >> ~/kawsay-backups/backup.log 2>&1`
4. Run `~/kawsay/deploy/backup.sh prod` once by hand and do the restore below on the dev environment

## Restore

```bash
# 1. Bring the backup to your computer and decrypt it there (the key never goes to the VM)
scp <user@vm>:kawsay-backups/prod/<file>.dump.age .
age --decrypt -i kawsay-backup.key -o kawsay.dump <file>.dump.age

# 2. Send the plain dump to the VM, restore it into the target environment, delete it
scp kawsay.dump <user@vm>:/tmp/kawsay.dump
ssh <user@vm> 'cd ~/kawsay && docker compose -p kawsay-dev --env-file deploy/dev.env -f deploy/compose.yml \
  exec -T postgres pg_restore -U kawsay -d kawsay --clean --if-exists < /tmp/kawsay.dump && rm /tmp/kawsay.dump'
rm kawsay.dump
```

3. Check: sign in on the matching app variant and pull; the history appears.

## Still open

Backups live on the same VM: a lost VM loses them too. Before the public release, copy them off-site
(e.g. Cloudflare R2) with the same encryption.
