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

## Commercialization Standard

The user's target is not just "the domain can open"; the target is full commercialization. Zingpop should be considered commercially ready only when it can charge customers, process real customer code and account data, sign business agreements, and operate continuously without unresolved licensing, privacy, security, multi-user isolation, or operations blockers.

Track the full commercial launch gate in `docs/commercialization-readiness.md`.

## 2026-05-10 Production Status

The core domain deployment is now live:

```text
http://www.zingpop.cn   -> 301 -> https://www.zingpop.cn/
https://www.zingpop.cn  -> 200
https://zingpop.cn      -> 200
https://app.zingpop.cn  -> 302 -> https://www.zingpop.cn/auth/phone when unauthenticated
```

Infrastructure status:

- ICP filing is complete.
- Huawei Cloud ECS/Flexus has been upgraded to `4 vCPU / 8 GiB`.
- DNS points `zingpop.cn`, `www.zingpop.cn`, and `app.zingpop.cn` to `121.36.58.22`.
- Let's Encrypt certificates are active for `www.zingpop.cn`/`zingpop.cn` and `app.zingpop.cn`.
- `certbot renew --dry-run` succeeded.
- `zingpop-console.service` is active on `127.0.0.1:3000`.
- `zingpop-opencode.service` is active on `127.0.0.1:4096`.
- Nginx is active on public `80` and `443`.
- Security group should now expose only public `80`/`443`; SSH `22` is restricted to the user's fixed IP.
- Public `3000`, `3001`, and `4096` are removed from the security group.

Build status:

- `scripts/production-build.sh` completed successfully after the memory upgrade.
- Clean production redeploy from commit `105ea9c7974628af28dabd027ba28a01a8c3c37e` completed on 2026-05-22.
- `nginx -t` passed after reinstalling the committed `deploy/nginx/zingpop-app.conf` and `deploy/nginx/zingpop-www.conf` templates.
- `zingpop-console.service`, `zingpop-opencode.service`, and `nginx.service` restarted and were active after the clean redeploy.
- Console output was checked for `@manifest` / `assetsPath` dev SSR imports before and after install:

```text
source clean
installed clean
```

Known current follow-up:

- The user reported that the frontend link could not open in the browser even though server and external `curl` checks returned expected status codes. This was resolved client-side after checking proxy/DNS behavior.
- On Windows with proxy software, DNS may resolve to `198.18.0.x` fake-IP addresses. That can be normal, but proxy/browser routing can still cause open failures.
- Phone auth is not complete yet:
  - `https://www.zingpop.cn/auth/phone` loads.
  - Sending a registration code currently shows the localized "Authentication service is not ready" error.
  - In code, that error maps to missing database configuration/resource access before SMS is attempted.
  - If only SMS is missing, the expected localized error is "短信服务尚未配置".
  - Check database env/migrations first, then Huawei Cloud SMS credentials and templates.
- Payment is not complete yet:
  - WeChat Pay and Alipay code exists, but production merchant accounts, credentials, callback URLs, and end-to-end live payment verification are not complete.
  - Development-mode fake payment fallback and any historical fake payment record do not count as real payment readiness.
  - Domestic Lite/subscription checkout is still blocked in code with "Lite checkout has not been migrated to domestic payments yet".
  - Legacy Stripe subscription/reload paths still exist and must be reviewed before relying on them for the China-market paid flow.

Client-side diagnostics:

```powershell
curl.exe -I https://www.zingpop.cn/
curl.exe -I https://zingpop.cn/
curl.exe -I https://app.zingpop.cn/
nslookup www.zingpop.cn 223.5.5.5
nslookup app.zingpop.cn 223.5.5.5
```

## Historical Dev Setup

This was the pre-production IP/port setup. It should not be used as the public production path after 2026-05-10.

- Product home was served on `http://121.36.58.22:3000/`.
- Workbench UI was served on `http://121.36.58.22:3001/`.
- Workbench backend was served on `http://121.36.58.22:4096/`.
- Huawei Cloud security group temporarily needed inbound TCP ports `3000`, `3001`, and `4096`.
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

## Pre-ICP Work Plan

Do not use an unfiled replacement domain while ICP filing is still pending. Until Huawei Cloud allows public domain use, keep `www.zingpop.cn`, `app.zingpop.cn`, and any unfiled replacement domain disabled for public traffic. Continue with internal IP testing and production preparation.

### 1. Production Build Validation

Run on the server:

```bash
cd /root/zingpop
chmod +x scripts/production-build.sh scripts/install-systemd.sh
./scripts/production-build.sh
```

Confirm the opencode Linux binary builds successfully.

Known result from 2026-05-08:

- The opencode Linux binary can build and run on the current server.
- `packages/console/app` production build can fail on the current `3.4 GiB` memory server with:

```text
Killed vite build
error: script "build" exited with code 137
```

Decision:

- Do not upgrade the ECS/Flexus specification while ICP filing is still pending.
- Before public launch after ICP approval, upgrade to at least `4 vCPU / 8 GiB` and rerun the full production build.
- Prefer `4 vCPU / 8 GiB` over `2 vCPU / 8 GiB` if it is cheaper or comparable. Use `4 vCPU / 16 GiB` only if 8 GiB still cannot complete the build.
- Until then, keep using the current server for internal backend/systemd/Nginx/SMS preparation.

### 2. systemd Service Installation

Configure `/etc/zingpop/zingpop.env`, then install and start the service:

```bash
./scripts/install-systemd.sh
systemctl enable --now zingpop-opencode
systemctl status zingpop-opencode --no-pager
```

The workbench backend target is:

```text
127.0.0.1:4096
```

It should not listen publicly on:

```text
0.0.0.0:4096
```

### 3. Internal IP Testing

Continue internal testing with:

```text
http://121.36.58.22:3000
http://121.36.58.22:3001
http://121.36.58.22:4096
```

Temporary Nginx-by-IP testing is acceptable, but do not publicly advertise or enable unfiled domain traffic.

### 4. Phone Auth Testing

The code and `account_password` table are now in place. Test the full flows:

```text
Register: phone + SMS verification code + password
Login: phone + password
Forgot password: phone + SMS verification code + new password
```

Also verify Huawei Cloud SMS templates, signature, Access Key, and environment variables can send verification codes.

### 5. Nginx Preparation

Prepare templates under `/etc/nginx/sites-available` and validate syntax:

```bash
nginx -t
```

Do not enable certificate-backed domain traffic until ICP is ready.

### 6. Security Group Plan

Final production exposure should be:

```text
80
443
```

Restrict SSH `22` to the user's fixed IP. Keep `3000`, `3001`, and `4096` public only for temporary internal testing, and close them before production.

### 7. Legal And Commercial Materials

Prepare these while waiting for ICP:

```text
User agreement
Privacy policy
Data processing notes
Third-party open-source notices
Dependency license audit
```

### 8. Multi-User Isolation Status

Core authenticated workbench isolation passed on the production host on 2026-05-22.

```text
account_id -> workspace_id -> project_id -> /srv/zingpop/workspaces/<workspace_id>/projects/<project_id>
```

Verified live:

- `?directory=/root`, the shared default directory, and another user's directory were forced back to the authenticated user's workspace project directory.
- `?workspace=...` was rejected by Nginx with `403`.
- Cross-user session ids were rejected.
- `/global/event` did not leak another user's event, directory, or workspace metadata.

Verified again after clean redeploy from commit `105ea9c7974628af28dabd027ba28a01a8c3c37e`:

- `nginx -t` passed.
- `zingpop-console.service`, `zingpop-opencode.service`, and `nginx.service` restarted and were active.
- `bun scripts/production-isolation-probe.mjs --mode all` returned `ALL PRODUCTION ISOLATION PROBES PASSED`.

Remaining before broad public paid use:

- Run the repeatable production probe with `bun scripts/production-isolation-probe.mjs --mode all` after every future deployment.
- Extend tenant-scope verification to file browsing, terminals, command execution, logs, model-call artifacts, and project import/creation.

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
https://www.zingpop.cn  -> product home/auth on 127.0.0.1:3000
https://app.zingpop.cn  -> auth_request to 127.0.0.1:3000/auth/status
https://app.zingpop.cn  -> opencode embedded workbench/API/WebSocket on 127.0.0.1:4096
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
- Validate the current Zingpop workbench on `https://app.zingpop.cn/<server-workspace-slug>/prompts`. The expected UI starts with `Prompt Templates` and includes the template list plus `Preview` / `Get Prompt` / `View Source`.
- Do not validate this flow by opening `www.zingpop.cn/workspace/...` console pages or old `localhost:4096` browser state. Those routes are not the current prompt-template workbench target.

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
- Build `packages/console/app` with `NITRO_PRESET=node_server` for the local product-home/auth service.
- Run the compiled opencode binary under `systemd`.
- Run the console `.output` under `zingpop-console.service` with Node.js 22+.
- Use Nginx as the public reverse proxy.
- Store logs under `/var/log/zingpop`.

Added deployment assets:

```text
deploy/env/zingpop.env.example
deploy/systemd/zingpop-console.service
deploy/systemd/zingpop-opencode.service
deploy/nginx/zingpop-app.conf
deploy/nginx/zingpop-www.conf
scripts/production-build.sh
scripts/install-systemd.sh
docs/production-deploy.md
```

### 7. Project Storage Model

Authenticated workbench projects now resolve under:

```text
/srv/zingpop/workspaces/<workspace_id>/projects/<project_id>
```

Production still needs to finish how user projects are created and imported:

- Upload project.
- Clone from Git.
- Create new project in a per-user workspace.
- Restrict each user to their own directories.
- Avoid exposing `/root` or shared server paths to normal users.

The previous shared staging guardrail `/srv/zingpop/workspaces/default` must not be used as a public multi-user workspace. The 2026-05-22 live probe confirmed that attempts to force this shared directory are mapped back to the authenticated user's own workspace directory.

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
- For full commercialization, also complete the business qualification, personal information, AI-service, payment, operations, and multi-user isolation checks in `docs/commercialization-readiness.md`.

### 9. Payment And Billing Readiness

Current status:

- Do not treat Zingpop as paid-launch ready.
- WeChat Pay H5 and Alipay implementation code is present in `packages/console/core/src/pay`, but production merchant onboarding and live verification are not complete.
- Payment callback route files exist under `packages/console/app/src/routes/pay`, but they still need real-provider verification on the production domain.
- The development fallback can mark payments paid locally in `APP_STAGE=development`; this is useful for testing UI flow only and must not be counted as real revenue collection.
- Lite/subscription checkout has not been migrated to domestic payments yet.
- Stripe-based subscription/reload code still exists and must be reviewed or replaced before China-market paid launch.

Before paid launch:

- Complete WeChat Pay merchant application and configure production `WECHAT_PAY_APP_ID`, `WECHAT_PAY_MCH_ID`, `WECHAT_PAY_SERIAL_NO`, `WECHAT_PAY_PRIVATE_KEY`, `WECHAT_PAY_PLATFORM_CERT`, `WECHAT_PAY_V3_KEY`, and `WECHAT_PAY_NOTIFY_URL`.
- Complete Alipay merchant application and configure production `ALIPAY_APP_ID`, `ALIPAY_PRIVATE_KEY`, `ALIPAY_PUBLIC_KEY`, `ALIPAY_NOTIFY_URL`, and `ALIPAY_RETURN_URL`.
- Set the real `DOMESTIC_PAYMENT_CNY_PER_CREDIT` and confirm displayed pricing, internal balance units, and provider charge amount match.
- Verify HTTPS reachability for provider callbacks on `www.zingpop.cn`.
- Verify real Alipay and WeChat Pay order creation, QR/H5/payment-page redirect, callback signature validation, order status update, and exactly-once balance crediting.
- Test failed payment, expired payment, duplicate callback, amount mismatch, refund, and chargeback/manual dispute handling.
- Implement domestic subscription purchase, renewal, cancellation, expiration, quota enforcement, and customer notification.
- Implement invoice/tax handling and provider settlement reconciliation.
- Add customer support and abuse handling for billing disputes.

## Minimum Production Checklist

- [x] ICP filing is complete before public domain use.
- [ ] Paid SaaS qualification is reviewed; required ICP filing/license path is confirmed.
- [ ] ICP filing number is displayed in the website footer with the required MIIT link.
- [x] No unfiled replacement domain is used for public traffic before ICP is complete.
- [x] ECS/Flexus is upgraded to at least `4 vCPU / 8 GiB` before final public-launch build validation.
- [x] Production build has been validated on the server with `scripts/production-build.sh`.
- [x] `packages/console/app` production build has been rerun successfully after the memory upgrade.
- [x] `zingpop-opencode` is installed and started through systemd.
- [x] `zingpop-console` is installed and started through systemd.
- [x] Product home/auth listens on `127.0.0.1:3000`, not public `0.0.0.0:3000`.
- [x] Workbench backend listens on `127.0.0.1:4096`, not public `0.0.0.0:4096`.
- [ ] Phone registration, phone-password login, and forgot-password reset are tested on the server.
- [ ] Huawei Cloud SMS templates, signature, Access Key, and environment variables are verified.
- [x] Domain is configured.
- [x] HTTPS certificate is active.
- [x] Nginx/reverse proxy is configured.
- [x] Product home works through the domain.
- [ ] Workbench works through the domain.
- [ ] A real model request succeeds through the production workbench.
- [x] Workbench production path can automatically connect to the backend through same-origin `location.origin`.
- [x] Users do not need to add `localhost:4096` or `121.36.58.22:4096` in the planned app-domain deployment.
- [x] Backend can require authentication through existing opencode Basic Auth.
- [x] Product-level phone auth flow is implemented.
- [x] Phone + password login is implemented.
- [x] Forgot-password SMS reset is implemented.
- [x] Workbench Nginx template checks product login before proxying to opencode.
- [x] Public workbench directory/session/event isolation is implemented and verified on production.
- [ ] Broader tenant-scope verification covers files, terminals, command execution, logs, model-call artifacts, and project import/creation.
- [x] Workbench service can use the opencode production build instead of Vite dev.
- [x] Workbench backend has a systemd service template.
- [ ] Server reboot restores all services automatically.
- [x] Production security group exposes only `80` and `443`; SSH `22` is restricted to a fixed IP.
- [x] Public access to `3000`, `3001`, and `4096` is removed before production.
- [ ] WeChat Pay merchant account is approved and production credentials are configured.
- [ ] Alipay merchant account is approved and production credentials are configured.
- [ ] Real Alipay payment creation, callback verification, and balance crediting are verified on production.
- [ ] Real WeChat Pay H5 payment creation, callback verification, and balance crediting are verified on production.
- [ ] Subscription purchase, renewal, cancellation, expiration, and quota enforcement are implemented and tested.
- [ ] Refund, invoice/tax handling, and payment reconciliation are ready.
- [ ] Original MIT license and copyright notices are retained.
- [ ] Dependency license audit is complete.
- [ ] Third-party open-source notices are ready.
- [ ] Third-party service/model/API terms are reviewed.
- [ ] Full commercialization checklist in `docs/commercialization-readiness.md` is complete or documented as not applicable.
- [ ] Zingpop branding replaces user-facing opencode branding where appropriate.
- [ ] User agreement and privacy policy are ready.
- [ ] Data processing notes are ready.

## Temporary IP Test Commands

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
