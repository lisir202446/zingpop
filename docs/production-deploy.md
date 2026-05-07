# Zingpop Production Deploy Notes

These notes are for the Huawei Cloud Ubuntu server. Do not enable domain traffic while ICP filing is still pending if the provider told you not to use the domain yet.

## Current Production Shape

The workbench should run as one same-origin service:

```text
https://app.zingpop.cn  -> Nginx -> 127.0.0.1:4096 -> opencode binary with embedded Web UI
```

This reuses existing opencode behavior:

- `packages/opencode` production build embeds `packages/app`.
- The web app defaults to `location.origin` outside Vite dev mode.
- The server already has `OPENCODE_SERVER_USERNAME` and `OPENCODE_SERVER_PASSWORD` Basic Auth.

No opencode core runtime file is changed for this deployment path.

## Why Use app.zingpop.cn

The existing workbench expects to live at the root of its browser origin. Serving it at `/workbench` under the product home would require frontend routing and asset-path changes. A subdomain keeps production additive:

```text
www.zingpop.cn  -> product home
app.zingpop.cn  -> workbench plus backend
```

`app.zingpop.cn` is not a separate purchased domain. It is a DNS record under the existing `zingpop.cn` domain. Add it after ICP rules allow domain use.

## Server Build

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
```

The install script copies the built binary to:

```text
/opt/zingpop/bin/opencode
```

Start the service:

```bash
systemctl enable --now zingpop-opencode
systemctl status zingpop-opencode --no-pager
ss -lntp | grep :4096
```

Expected listener:

```text
127.0.0.1:4096
```

Do not expose 4096 publicly in production. Nginx should be the public entry.

## Nginx

Templates are in:

```text
deploy/nginx/zingpop-app.conf
deploy/nginx/zingpop-www.conf
```

After ICP is complete, add DNS for `app.zingpop.cn` and issue a certificate for it. The existing `www.zingpop.cn` certificate does not automatically cover `app.zingpop.cn` unless it is a wildcard certificate.

Then enable the app proxy:

```bash
cp deploy/nginx/zingpop-app.conf /etc/nginx/sites-available/zingpop-app.conf
ln -sfn /etc/nginx/sites-available/zingpop-app.conf /etc/nginx/sites-enabled/zingpop-app.conf
nginx -t
systemctl reload nginx
```

Only enable `zingpop-www.conf` after the product home production server is finalized.

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
