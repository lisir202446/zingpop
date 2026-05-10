# Zingpop Production Deploy Notes

These notes are for the Huawei Cloud Ubuntu server. Do not enable domain traffic while ICP filing is still pending if the provider told you not to use the domain yet.

## Current Production Shape

Production uses two local services behind Nginx:

```text
https://www.zingpop.cn  -> Nginx -> 127.0.0.1:3000 -> product home and auth
https://app.zingpop.cn  -> Nginx -> auth_request 127.0.0.1:3000/auth/status
https://app.zingpop.cn  -> Nginx -> 127.0.0.1:4096 -> opencode embedded workbench
```

This keeps production additive:

- `packages/console/app` is built as a local Nitro node server for the product home and phone auth.
- `packages/opencode` production build embeds `packages/app`.
- The web app defaults to `location.origin` outside Vite dev mode.
- The server already has `OPENCODE_SERVER_USERNAME` and `OPENCODE_SERVER_PASSWORD` Basic Auth.

No opencode core runtime file is changed for this deployment path.

## 2026-05-10 Live Status

This path is now deployed on the Huawei Cloud server:

```text
Public IP: 121.36.58.22
Server spec: 4 vCPU / 8 GiB
Console service: 127.0.0.1:3000
Workbench backend: 127.0.0.1:4096
Public entry: Nginx on 80/443
```

Verified responses:

```text
http://www.zingpop.cn   -> 301
https://www.zingpop.cn  -> 200
https://zingpop.cn      -> 200
https://app.zingpop.cn  -> 302 to https://www.zingpop.cn/auth/phone when unauthenticated
```

Certificate renewal dry-run succeeded for:

```text
/etc/letsencrypt/live/www.zingpop.cn/fullchain.pem
/etc/letsencrypt/live/app.zingpop.cn/fullchain.pem
```

The console build previously failed when a SolidStart dev SSR manifest was compiled into the production node-server output. The deployment scripts now remove stale `.nitro` output and reject `@manifest` artifacts before install. The current installed output was verified as clean.

Current auth status:

- The phone auth page loads, but real registration/login/reset is not verified yet.
- A registration-code request currently shows "Authentication service is not ready", which maps to database configuration/resource access failure before SMS sending.
- Complete database env and migrations before testing Huawei Cloud SMS.

## Why Use app.zingpop.cn

The existing workbench expects to live at the root of its browser origin. Serving it at `/workbench` under the product home would require frontend routing and asset-path changes. A subdomain keeps production additive:

```text
www.zingpop.cn  -> product home
app.zingpop.cn  -> workbench plus backend
```

`app.zingpop.cn` is not a separate purchased domain. It is a DNS record under the existing `zingpop.cn` domain. Add it after ICP rules allow domain use.

## Server Build

The production console service runs the Nitro node-server output. Install Node.js 22 or newer before installing systemd services:

```bash
node -v
```

Run on the server, not on Windows:

```bash
cd /root/zingpop
chmod +x scripts/production-build.sh scripts/install-systemd.sh
./scripts/production-build.sh
```

The opencode build creates a Linux binary under:

```text
packages/opencode/dist/opencode-linux-x64/bin/opencode
```

Confirm this binary exists before continuing.

The console app build uses `NITRO_PRESET=node_server` by default through `scripts/production-build.sh`, so the product home/auth service can run locally on `127.0.0.1:3000`. Set `ZINGPOP_CONSOLE_NITRO_PRESET=cloudflare_module` only when building for Cloudflare instead of this server.

Server sizing note:

- The current pre-ICP server is enough to run the built opencode backend through systemd.
- It is not reliable enough for the full `packages/console/app` production build: on 2026-05-08 the build failed with `Killed vite build` / exit code `137` on about `3.4 GiB` memory.
- Do not upgrade only for ICP-waiting internal testing.
- ICP is now complete and the Huawei Cloud ECS/Flexus plan has been upgraded to `4 vCPU / 8 GiB`.
- After the upgrade, `./scripts/production-build.sh` completed successfully on 2026-05-10.
- If the console offers both `2 vCPU / 8 GiB` and `4 vCPU / 8 GiB`, prefer `4 vCPU / 8 GiB` when it is cheaper or comparable. Use `4 vCPU / 16 GiB` only if 8 GiB still fails.

## Install systemd Guard

Run on the server:

```bash
cd /root/zingpop
./scripts/install-systemd.sh
```

Edit the environment file:

```bash
nano /etc/zingpop/zingpop.env
```

Required production values:

```text
OPENCODE_SERVER_USERNAME=opencode
OPENCODE_SERVER_PASSWORD=<strong private password>
ZINGPOP_OPENCODE_BIN=/opt/zingpop/bin/opencode
ZINGPOP_CONSOLE_HOST=127.0.0.1
ZINGPOP_CONSOLE_PORT=3000
APP_STAGE=production
ZEN_SESSION_SECRET=<long random secret>
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=<dedicated mysql user>
MYSQL_PASSWORD=<dedicated mysql password>
MYSQL_DATABASE=opencode
```

The install script copies the built workbench binary to:

```text
/opt/zingpop/bin/opencode
```

It also copies the built product home to:

```text
/opt/zingpop/console/.output
```

Start both services:

```bash
systemctl enable --now zingpop-opencode zingpop-console
systemctl status zingpop-opencode zingpop-console --no-pager
ss -lntp | grep -E ':3000|:4096'
```

Expected listeners:

```text
127.0.0.1:3000
127.0.0.1:4096
```

Do not expose 4096 publicly in production. Nginx should be the public entry.

## Nginx

Templates are in:

```text
deploy/nginx/zingpop-app.conf
deploy/nginx/zingpop-www.conf
```

After ICP is complete, add DNS for `zingpop.cn`, `www.zingpop.cn`, and `app.zingpop.cn`, then issue certificates. The existing `www.zingpop.cn` certificate does not automatically cover `app.zingpop.cn` unless it is a wildcard certificate.

Then enable both proxies:

```bash
cp deploy/nginx/zingpop-www.conf /etc/nginx/sites-available/zingpop-www.conf
cp deploy/nginx/zingpop-app.conf /etc/nginx/sites-available/zingpop-app.conf
ln -sfn /etc/nginx/sites-available/zingpop-www.conf /etc/nginx/sites-enabled/zingpop-www.conf
ln -sfn /etc/nginx/sites-available/zingpop-app.conf /etc/nginx/sites-enabled/zingpop-app.conf
nginx -t
systemctl reload nginx
```

Only enable these configs after `zingpop-console` is listening on `127.0.0.1:3000`; `zingpop-app.conf` depends on `/auth/status` through Nginx `auth_request`.

After Nginx is the public entry, remove public security-group access to port `4096`. Keep only `80` and `443` public, plus restricted SSH.

## Authentication

Stage 1 authentication uses opencode's existing Basic Auth:

```text
OPENCODE_SERVER_USERNAME
OPENCODE_SERVER_PASSWORD
```

This prevents unauthenticated public access, but it is not full product account auth.

Before public multi-user launch, Zingpop still needs:

- User accounts and sessions.
- Per-user project ownership.
- Authorization checks before opening projects, sessions, files, terminals, and commands.
- A product-level project creation/import flow.

## Project Isolation

The systemd service runs as a dedicated Linux user:

```text
zingpop
```

Default project working directory:

```text
/srv/zingpop/workspaces/default
```

Data and config:

```text
/srv/zingpop/data
/srv/zingpop/config
```

This is acceptable for a protected single-tenant staging service. It is not enough for public multi-user isolation because the existing opencode server accepts a project `directory` parameter. Public multi-user isolation should be implemented as a Zingpop layer or with explicit approval for a narrow opencode-core guard.

## ICP Hold

While ICP filing is pending:

- Keep using public IP and dev ports for internal testing.
- Keep the current server specification if internal testing is acceptable; defer the `4 vCPU / 8 GiB` upgrade until ICP is approved and final production build validation is needed.
- Do not use an unfiled replacement domain for public traffic.
- Keep the certificate files, but do not enable domain traffic if Huawei Cloud told you not to use the domain.
- Prepare scripts, services, and Nginx templates without binding the domain publicly.
- You may copy Nginx templates into `/etc/nginx/sites-available` and run `nginx -t`, but wait for ICP before enabling public domain traffic.
- Continue testing the current internal IP endpoints:

```text
http://121.36.58.22:3000
http://121.36.58.22:3001
http://121.36.58.22:4096
```

- Test phone registration, phone-password login, and forgot-password reset after the `account_password` migration is applied.
- Verify Huawei Cloud SMS templates, signature, Access Key, and environment variables before relying on SMS login.
- Before production, expose only `80` and `443`; restrict SSH `22` to the user's fixed IP and close public access to `3000`, `3001`, and `4096`.
- Prepare user agreement, privacy policy, data processing notes, third-party open-source notices, and dependency license audit during the ICP waiting period.
- Continue multi-user isolation design before public launch:
  - Define each user's project directory.
  - Define access checks for project, session, and file.
  - Prevent users from entering raw server paths such as `/root/zingpop`.
