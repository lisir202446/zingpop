# Zingpop Production Readiness

This document tracks what is still needed to move from the current cloud dev setup to a production flow where users open a domain and can use the product without manually adding a server.

## Hard Integration Rule

Production readiness work must not change opencode's reusable bottom-layer runtime unless the user explicitly approves that exact low-level change.

Default approach:

- Reuse existing opencode capabilities whenever they exist.
- Add production behavior through configuration, deployment scripts, Nginx, systemd, environment variables, wrapper scripts, docs, or Zingpop-only integration layers.
- Do not break existing `packages/opencode` CLI/server behavior, SDK generation, project/session/file routing, desktop runtime, or web runtime.
- Before editing `packages/opencode/src`, verify that no existing opencode feature or external deployment wrapper can solve the problem.
- If a requirement truly needs opencode core changes, document the tradeoff and get explicit approval before editing.

## Current Dev Setup

- Product home is served on `http://121.36.58.22:3000/`.
- Workbench UI is served on `http://121.36.58.22:3001/`.
- Workbench backend is served on `http://121.36.58.22:4096/`.
- Huawei Cloud security group currently needs inbound TCP ports `3000`, `3001`, and `4096`.
- The workbench may still show `localhost:4096` if the browser has an old default server saved.
- Users must manually add `http://121.36.58.22:4096` to connect the workbench to the cloud backend.
- Opening a project must use a server path such as `/root/zingpop`, not a local Windows path like `D:\...`.

## Target User Flow

Users should only need to open a domain:

```text
https://www.zingpop.cn
https://app.zingpop.cn
```

The app should automatically connect to the correct backend. Users should not need to see or configure:

```text
http://localhost:4096
http://121.36.58.22:4096
```

## Remaining Work

### 1. Domain

- Use:
  - `https://www.zingpop.cn` for the product home.
  - `https://app.zingpop.cn` for the workbench.
- Add DNS records pointing to the server public IP:

```text
121.36.58.22
```

### 2. HTTPS

- Configure HTTPS certificates for the production domains.
- Use Nginx plus Let's Encrypt/Certbot, or an equivalent managed certificate setup.
- Avoid exposing production users to raw HTTP URLs and ports.

### 3. Reverse Proxy

Use Nginx or another reverse proxy so users do not need port numbers.

Recommended routing:

```text
https://www.zingpop.cn  -> product home
https://app.zingpop.cn  -> opencode embedded workbench UI
https://app.zingpop.cn  -> opencode backend API/WebSocket routes
```

The proxy should hide these internal services:

```text
localhost:3000
localhost:3001
localhost:4096
```

### 4. Automatic Backend Connection

- The workbench must default to the production backend automatically.
- The UI should not default to `localhost:4096` in production.
- Preferred production behavior:

```text
default backend = location.origin
```

- opencode already supports this when the web UI is served outside Vite dev mode.
- The production path uses the existing opencode build that embeds `packages/app` into the backend binary.
- Serve the workbench on its own origin (`app.zingpop.cn`) so no frontend routing changes are needed.

### 5. Backend Security

The current dev backend can run without a password:

```text
OPENCODE_SERVER_PASSWORD is not set; server is unsecured.
```

Production must add proper security before public use:

- Stage 1: use existing `OPENCODE_SERVER_USERNAME` and `OPENCODE_SERVER_PASSWORD`.
- Stage 1: run the service as a dedicated Linux user, not root.
- Stage 1: use `/srv/zingpop/workspaces` as the workspace root.
- Before public multi-user launch: add user login, session authentication, authorization checks, project/workspace ownership, and per-user isolation.
- No public user should be able to access another user's files, sessions, terminals, or commands.

Product login decision:

```text
First registration: phone number + SMS verification code + set password
Later login: phone number + password
Password reset: phone number + SMS verification code + set new password
```

Track the detailed plan in `docs/auth-phone-password.md`.

Implemented product-login stage:

```text
packages/console/core/src/schema/account_password.sql.ts
packages/console/core/src/password-auth.ts
packages/console/app/src/routes/auth/phone.tsx
packages/console/app/src/routes/auth/status.ts
deploy/nginx/zingpop-app.conf
```

The workbench Nginx template now uses `auth_request` against `/auth/status`, so unauthenticated users are redirected to `/auth/phone` before reaching the opencode backend.

### 6. Production Build

The current setup uses dev servers. Production should not rely on `vite dev`.

Needed:

- Build opencode with `bun run --cwd packages/opencode build --single`.
- Run the compiled opencode binary under `systemd`.
- Use Nginx as the public reverse proxy.
- Store logs under `/var/log/zingpop`.

Added deployment assets:

```text
deploy/env/zingpop.env.example
deploy/systemd/zingpop-opencode.service
deploy/nginx/zingpop-app.conf
deploy/nginx/zingpop-www.conf
scripts/production-build.sh
scripts/install-systemd.sh
docs/production-deploy.md
```

### 7. Project Storage Model

Current testing opens a server path:

```text
/root/zingpop
```

Production must define how user projects are created and stored:

- Upload project.
- Clone from Git.
- Create new project in a per-user workspace.
- Restrict each user to their own directories.
- Avoid exposing `/root` or shared server paths to normal users.

Current staging guardrail:

```text
/srv/zingpop/workspaces/default
```

This is a single-tenant staging guardrail, not final public multi-user isolation.

### 8. Commercial License Review

The current repository declares `MIT` in the root `package.json`, package manifests, and `LICENSE`.

MIT permits commercial use, modification, distribution, sublicensing, and selling copies of the software, as long as the original copyright notice and license text are kept with substantial copies of the software.

Before commercial launch:

- Keep the original `LICENSE` text and copyright notice.
- Add an open-source notices or third-party licenses page/file in the product.
- Audit dependency licenses for GPL/AGPL or other restrictive licenses.
- Review terms for any model providers, APIs, SDKs, fonts, icons, images, and hosted services used by the product.
- Avoid implying official affiliation with the original opencode project.
- Review whether the `opencode` name, logo, or branding can be used commercially; prefer Zingpop branding in user-facing surfaces.
- Prepare user agreement, privacy policy, data processing terms, and security disclosures before handling real user code or business data.

## Minimum Production Checklist

- [ ] ICP filing is complete before public domain use.
- [ ] Domain is configured.
- [ ] HTTPS certificate is active.
- [ ] Nginx/reverse proxy is configured.
- [ ] Product home works through the domain.
- [ ] Workbench works through the domain.
- [x] Workbench production path can automatically connect to the backend through same-origin `location.origin`.
- [x] Users do not need to add `localhost:4096` or `121.36.58.22:4096` in the planned app-domain deployment.
- [x] Backend can require authentication through existing opencode Basic Auth.
- [x] Product-level phone auth flow is implemented.
- [x] Phone + password login is implemented.
- [x] Forgot-password SMS reset is implemented.
- [x] Workbench Nginx template checks product login before proxying to opencode.
- [ ] Public multi-user project isolation is implemented.
- [x] Workbench service can use the opencode production build instead of Vite dev.
- [x] Workbench backend has a systemd service template.
- [ ] Server reboot restores all services automatically.
- [ ] Original MIT license and copyright notices are retained.
- [ ] Dependency license audit is complete.
- [ ] Third-party service/model/API terms are reviewed.
- [ ] Zingpop branding replaces user-facing opencode branding where appropriate.
- [ ] User agreement and privacy policy are ready.

## Temporary Dev Commands

Use these only for the current test server setup:

```bash
cd /root/zingpop
PUBLIC_HOST=121.36.58.22 ./scripts/cloud-dev.sh
```

Check ports:

```bash
ss -lntp | grep -E ':3000|:3001|:4096'
```

Expected listeners:

```text
0.0.0.0:3000
0.0.0.0:3001
0.0.0.0:4096
```
