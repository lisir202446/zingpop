# Zingpop Security Operations Runbook

Last updated: 2026-05-28

This runbook is the launch gate for production secrets, rate limits, audit logs, abnormal-use protection, and command execution risk controls. It is intentionally operational: keep secrets on the server and in provider consoles, never in Git.

## Required Pre-Launch Actions

1. Replace `OPENCODE_SERVER_PASSWORD` with a strong private value.
2. Revoke and recreate every exposed GitHub token. Treat any token pasted into a terminal, chat, issue, log, or build output as compromised.
3. Keep `/etc/zingpop/zingpop.env` outside Git and set it to owner-only permissions.
4. Rotate database, SMS, model-provider, deployment, and payment credentials before public paid launch.
5. Use least-privilege credentials for the database, SMS provider, cloud APIs, model-provider keys, GitHub deployment access, and payment provider callbacks.
6. Keep public security-group exposure limited to `80` and `443`; restrict SSH `22` to trusted source IPs only.
7. Keep public `3000`, `3001`, and `4096` closed. The console and opencode services must stay behind Nginx on loopback.
8. Keep the public footer filing links current, including the ICP filing and the 公安联网备案 record `粤公网安备44010602015865号`.
9. Enable `zingpop-backup.timer` and `zingpop-health-check.timer` after every server rebuild.
10. Keep `/etc/logrotate.d/zingpop` installed so application logs cannot fill the disk.

## Public Filing Display

Zingpop's public pages must display the 公安联网备案 icon and text in the website footer after the filing is approved.

- Record text: `粤公网安备44010602015865号`
- Record link: `https://beian.mps.gov.cn/#/query/webSearch?code=44010602015865`
- Footer icon asset: `/beian-police.png`
- Verification route: open the public homepage and legal pages and confirm the footer contains the ICP filing link and the public-security filing link.

## Repeatable Checks

Run these after every production deployment:

```bash
bun scripts/production-security-check.mjs --repo /root/zingpop-release --strict
bun scripts/production-isolation-probe.mjs --mode all
bun scripts/production-auth-sms-probe.mjs
/opt/zingpop/bin/production-health-check.mjs --strict
```

Run this locally before pushing a release branch:

```bash
bun scripts/license-audit.mjs --repo .
```

## Installed Production Controls

`scripts/install-systemd.sh` installs the following operations controls on the server:

- `/opt/zingpop/bin/production-rotate-local-secrets.sh`: rotates local generated secrets in `/etc/zingpop/zingpop.env`, including `ZEN_SESSION_SECRET` and `OPENCODE_SERVER_PASSWORD`.
- `/opt/zingpop/bin/production-backup.sh`: creates a MySQL dump and filesystem/config backup under `${ZINGPOP_BACKUP_ROOT:-/srv/zingpop/backups}`.
- `/opt/zingpop/bin/production-restore-drill.sh`: verifies the newest backup and can optionally restore it into a drill database.
- `/opt/zingpop/bin/production-health-check.mjs`: checks public URLs, certificates, systemd services, timers, disk space, MySQL availability, and recent backups.
- `/etc/systemd/system/zingpop-backup.timer`: runs the backup job daily.
- `/etc/systemd/system/zingpop-health-check.timer`: runs the health and certificate check every five minutes.
- `/etc/logrotate.d/zingpop`: rotates Zingpop application logs daily.

Enable the timers after installation:

```bash
systemctl enable --now zingpop-backup.timer zingpop-health-check.timer
systemctl list-timers 'zingpop-*'
```

## Rate Limits And Abuse Controls

Current code-side controls:

- Auth and SMS: phone verification has resend cooldown, daily send limit, verification attempt limit, password attempt limit, and public error messages that do not leak provider details.
- Project import/upload: hosted local-folder upload enforces file count, file size, total size, excluded directories, `.env` blocking, safe relative paths, and Git import host allowlist.
- Model calls: the Zingpop model gateway enforces anonymous IP limits, API-key limits, model TPM limits, subscription quota limits, monthly workspace limits, and monthly user limits.
- Workbench isolation: Nginx auth gates inject the authorized workspace/project directory and block client-supplied `directory` and `workspace` overrides.
- Nginx public edge: `app.zingpop.cn` applies separate workbench/project API request limits, and `www.zingpop.cn` applies separate auth/model/general request limits. Excess traffic receives HTTP `429`.

Operational controls still required at launch:

- Review opencode command execution endpoints after each opencode upgrade and keep them behind authenticated project routing.
- Watch for abnormal command execution patterns in Nginx access logs and `zingpop-opencode` journal logs.
- Add a production Nginx or gateway rule if a specific command endpoint becomes abusive or bypassable.

## Audit Logs

Audit evidence sources for launch:

- `zingpop-console` journal: auth actions, workbench auth gate failures, project API errors, payment callback errors.
- `zingpop-opencode` journal: workbench backend events, session and provider failures, command execution runtime errors.
- Nginx access and error logs: public IP, route, upstream, response status, and auth gate failures.
- Database usage tables: model-call usage, billing source, API key, workspace, session, provider, token counts, and cost.
- Payment provider dashboards: order, callback, refund, and charge status.

Audit logs must not include raw SMS codes, passwords, tokens, private customer file contents, raw phone numbers, or raw local file paths.

Sensitive operations that must be reviewed during incident response:

- Login and reset attempts.
- SMS sending spikes.
- Project create/import/upload/read actions.
- Model-call spikes, repeated 401/429/500 responses, and provider failover loops.
- Command execution, terminal sessions, and suspicious file reads.
- Credential changes, API-key creation/deletion, payment method changes, and admin/member changes.

## Secret Rotation Procedure

1. Create new provider credentials with the minimum required permissions.
2. Update `/etc/zingpop/zingpop.env` on the server.
3. Set permissions:

```bash
chown root:root /etc/zingpop/zingpop.env
chmod 600 /etc/zingpop/zingpop.env
```

4. Restart services:

```bash
systemctl restart zingpop-console zingpop-opencode nginx
systemctl status zingpop-console zingpop-opencode --no-pager
```

5. Run production probes and one real browser smoke test.
6. Revoke the old credentials only after the new credentials are verified.
7. Record the rotation time, credential owner, affected provider, and verification evidence.

For local generated Zingpop secrets, use the helper:

```bash
/opt/zingpop/bin/production-rotate-local-secrets.sh
systemctl restart zingpop-console zingpop-opencode nginx
```

Provider-side secrets still need provider-console rotation. The helper does not rotate GitHub, SMS, database, model-provider, payment, or cloud credentials.

## Backup, Restore, Monitoring, And Log Rotation

Daily backup is required before accepting paying users:

```bash
systemctl enable --now zingpop-backup.timer
/opt/zingpop/bin/production-backup.sh
/opt/zingpop/bin/production-restore-drill.sh
```

Run a database restore drill into a non-production database:

```bash
ZINGPOP_RESTORE_DRILL_DATABASE=zingpop_restore_drill \
  /opt/zingpop/bin/production-restore-drill.sh
```

The health timer verifies service availability, disk headroom, MySQL, certificate lifetime, and recent backups. Set `ZINGPOP_ALERT_WEBHOOK_URL` in `/etc/zingpop/zingpop.env` to send failure alerts to an operations webhook.

```bash
systemctl enable --now zingpop-health-check.timer
journalctl -u zingpop-health-check.service -n 100 --no-pager
```

Ubuntu's default Nginx log rotation should remain enabled. Zingpop application logs are rotated by `/etc/logrotate.d/zingpop`.

## Rollback Procedure

Keep the previous release directory on the server until the new release has passed browser E2E, isolation probes, auth/SMS probes, health checks, and payment smoke tests.

To roll back:

1. `cd` into the last known good release directory.
2. Run `./scripts/install-systemd.sh`.
3. Restore the matching Nginx templates:

```bash
cp deploy/nginx/zingpop-app.conf /etc/nginx/sites-available/zingpop-app.conf
cp deploy/nginx/zingpop-www.conf /etc/nginx/sites-available/zingpop-www.conf
nginx -t
systemctl daemon-reload
systemctl restart zingpop-console zingpop-opencode nginx
```

4. Run `/opt/zingpop/bin/production-health-check.mjs --strict`, `bun scripts/production-isolation-probe.mjs --mode all`, and a real browser smoke test.
5. If the rollback also needs data recovery, restore only from a verified backup and record the exact backup directory used.

## Incident Response

1. Contain: disable affected credentials, model provider keys, payment callbacks, or public routes.
2. Preserve: copy relevant Nginx logs, systemd journals, database audit evidence, and provider dashboard records.
3. Assess: identify affected accounts, workspaces, projects, prompts, model outputs, payments, and command execution history.
4. Notify: contact affected users and regulators when required by law or contract.
5. Recover: rotate credentials, patch code/config, redeploy, and rerun production probes.
6. Review: add a regression test, update this runbook, and document the root cause.
