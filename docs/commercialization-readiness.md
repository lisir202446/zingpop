# Zingpop Commercialization Readiness

Date: 2026-05-12

This document defines the bar for "commercially usable" Zingpop. A production domain that loads is not enough. Commercial launch means Zingpop can charge customers, process real customer code and account data, sign business agreements, and operate continuously without avoidable licensing, security, privacy, or qualification blockers.

This checklist is an engineering and operations tracker, not legal advice. For telecom licensing, personal information protection, tax, contracts, and AI-service compliance, confirm the final interpretation with qualified counsel or the relevant authority before public paid launch.

## Launch Rule

Do not treat Zingpop as ready for full commercialization until all launch blockers below are either completed or explicitly documented as not applicable by a qualified reviewer.

## Current Baseline

- Public HTTPS entry is already deployed for `https://www.zingpop.cn` and `https://app.zingpop.cn`.
- The production path uses Nginx, systemd, `127.0.0.1:3000` for product/auth, and `127.0.0.1:4096` for the opencode workbench backend.
- Current infrastructure is suitable for protected staging or controlled internal testing.
- It is not yet suitable for broad public paid use until production auth/SMS verification, real payment integration, broader tenant-scope end-to-end verification, legal/compliance materials, license review, operations, and commercial workflows are completed.

## Progress Log

### 2026-05-22: Authenticated Workbench Isolation Probe Passed

Production was hot-patched and verified on the Huawei Cloud host after the isolation fixes were pushed through commit `de409d112251ae250dd8b8a2900011db91411494`.

Verified on `https://app.zingpop.cn` with two temporary authenticated accounts:

- A logged-in request with `?directory=/root` was forced back to A's authorized workspace project directory.
- Attempts to use the shared default directory and B's workspace directory were also forced back to A's authorized directory.
- Client-supplied `?workspace=...` was rejected by Nginx with `403`.
- A could read A's own session, but A could not read B's session and B could not read A's session.
- `/global/event` streamed A's own event and did not leak B's event, directory, or workspace metadata.
- Final live probe result: `ALL AUTHENTICATED ISOLATION PROBES PASSED`.

Historical deployment note: this first verification was performed on a hot-patched server state. That state was later replaced by the clean production redeploy recorded below. Do not deploy an archive or Nginx template older than commit `de409d112251ae250dd8b8a2900011db91411494`, or the `directory` query handling can regress.

### 2026-05-22: Clean Production Redeploy And Repeatable Isolation Probe Passed

The server was rebuilt and reinstalled from clean release commit `105ea9c7974628af28dabd027ba28a01a8c3c37e`, replacing the hot-patched state with committed source, Nginx templates, and systemd artifacts.

Production deployment evidence:

- `scripts/production-build.sh` completed successfully with `ZINGPOP_SKIP_BUN_INSTALL=1` while reusing the verified dependency tree.
- `scripts/install-systemd.sh` installed the workbench and console artifacts.
- `deploy/nginx/zingpop-app.conf` and `deploy/nginx/zingpop-www.conf` were installed to the active Nginx targets.
- `nginx -t` passed.
- `zingpop-console.service`, `zingpop-opencode.service`, and `nginx.service` restarted and were active.
- `bun scripts/production-isolation-probe.mjs --mode all` passed on production with final result `ALL PRODUCTION ISOLATION PROBES PASSED`.

Next work from this checkpoint:

- Verify the real logged-in workbench UI opens end to end through `https://app.zingpop.cn`.
- Verify a real model request through the production workbench.
- Extend tenant-scope verification beyond sessions/events to file browsing, terminal/command execution, logs, model-call artifacts, and project import/creation.
- Continue production auth/SMS, payment, legal/compliance, secrets, audit logging, backup, monitoring, and reboot-recovery work below.

### 2026-05-25: Session Status Reload Fix And Production Probe Passed

The production baseline was advanced after fixing the workbench reload path that returned `text/html` or `401 Unauthorized` for `/session/status`.

Current online baseline requirements:

- Console/auth fix commit `c77faff0dc80d6163c144ad6b94b50c461268034` is included. This prevents `/session/status` from being interpreted as a session id named `status` during the `auth_request` ownership check.
- Nginx fix commit `19325e5f3e4ffe8e130fc48b1954f71ab1e017b9` is included. This makes the exact `/session/status` proxy pass the same opencode Basic Auth snippet as the normal workbench proxy.
- The active production Nginx config has exactly one `include /etc/nginx/snippets/zingpop-opencode-basic-auth.conf;` in the root workbench proxy block and one in the `/session/status` proxy block.
- The console output was rebuilt and installed on the Huawei Cloud server, Nginx was reloaded with the fixed app config, and `nginx -t` passed.
- `bun scripts/production-isolation-probe.mjs --mode all` passed on production with final result `ALL PRODUCTION ISOLATION PROBES PASSED`.

The repeatable production probe now covers:

- Unauthenticated `/session/status` redirects to phone login instead of returning raw backend output.
- Authenticated `/session/status?directory=/root` returns HTTP `200` JSON and does not return `text/html`.
- Client-supplied `directory` and `workspace` attacks remain blocked or forced back to the authorized workspace project directory.
- Cross-user session reads remain blocked.
- `/global/event` remains filtered to the authenticated workspace.

Deployment rule from this checkpoint:

- Do not deploy a source archive, console build, or `deploy/nginx/zingpop-app.conf` older than commit `19325e5f3e4ffe8e130fc48b1954f71ab1e017b9`.
- Run `bun scripts/production-isolation-probe.mjs --mode all` after every future production deployment.
- If the probe fails, treat the deployment as not commercially usable until the regression is fixed or rolled back.

### 2026-05-25: Production Auth/SMS Configuration Probe Passed

The production console was rebuilt and installed from commit `f412214f84420b71d9b14696c17101e8570496c0`, hardening phone auth and SMS handling.

Implemented source changes:

- Password reset now verifies an existing phone account and no longer creates a new account through the reset path.
- Password login returns one public failure message for nonexistent phone numbers, wrong passwords, missing password rows, and lockout.
- SMS provider failures are logged server-side and exposed to users as a generic verification-code send failure.
- `scripts/production-auth-sms-probe.mjs` was added as a repeatable production auth/SMS configuration check.

Production verification:

- `bun scripts/production-auth-sms-probe.mjs` passed with final result `ALL PRODUCTION AUTH/SMS CONFIG PROBES PASSED`.
- `bun scripts/production-isolation-probe.mjs --mode all` passed with final result `ALL PRODUCTION ISOLATION PROBES PASSED`.
- The live environment uses the Huawei Cloud Marketplace/APIG SMS interface (`SMS_PROVIDER=huawei_apig`), and verification-code registration is working in production.

Remaining manual auth-flow confirmation before marking the whole auth/SMS loop closed:

- Phone-password login with a registered phone number.
- Forgot-password reset through SMS code and a new password.
- Same public login failure copy for unregistered phone plus random password and registered phone plus wrong password.

### 2026-05-27: Local Commercialization Materials And Audit Hooks Added

Local source now includes the launch-facing legal, compliance, security, and open-source materials needed before a production upload:

- User agreement, privacy policy, data-processing notice, third-party processor disclosure, account deletion/data deletion flow, and public open-source notice routes were added under `/legal/*`.
- The public footer includes the ICP filing link and the 公安联网备案 link `粤公网安备44010602015865号`.
- `docs/security-operations.md` defines the production secret rotation, rate-limit, audit-log, abnormal-use, filing-display, and incident-response runbook.
- `scripts/production-security-check.mjs` checks accidental secret patterns and production environment hygiene before upload.
- `scripts/license-audit.mjs` checks direct production dependency licenses and keeps packages with missing license metadata in explicit manual review.
- Console auth/project routes emit structured `audit:` records for SMS, login/reset, project create/list/rename/delete/import/upload/read, manifest, and file-read actions.

Remaining external launch actions from this checkpoint: rotate production secrets, revoke exposed GitHub tokens, confirm paid SaaS qualification, complete payment-provider production verification, and run production browser E2E after deployment.

### 2026-05-28: Local Operations Controls Added

Local source now includes the first production operations layer needed before the next upload:

- Nginx public-edge rate limits were added for workbench/project routes on `app.zingpop.cn` and auth/model/general routes on `www.zingpop.cn`.
- `scripts/install-systemd.sh` now installs backup and health-check systemd timers, a Zingpop logrotate config, and operations helper scripts.
- `scripts/production-backup.sh` backs up MySQL plus `/srv/zingpop`, `/etc/zingpop`, Nginx, systemd, and logrotate config while excluding the backup directory itself.
- `scripts/production-restore-drill.sh` verifies backup checksums, gzip/tar integrity, and can optionally restore into a non-production drill database.
- `scripts/production-health-check.mjs` checks public URLs, TLS certificate lifetime, systemd services, timers, disk headroom, MySQL, and recent backups.
- `scripts/production-rotate-local-secrets.sh` rotates local generated Zingpop secrets in `/etc/zingpop/zingpop.env`.
- `docs/model-provider-compliance.md` defines the model-provider commercial terms, data-retention, training, cross-border, abuse-policy, and generative-AI filing/security-assessment signoff gate.
- `docs/open-source-notices.md` now records reviewed MIT license evidence for `@openauthjs/openauth` and `@solidjs/start`.

Remaining external launch actions from this checkpoint: actually deploy these controls, rotate production/provider/GitHub secrets in their consoles, enable the timers on the server, run at least one backup plus restore drill, configure an alert webhook, verify reboot recovery, and obtain the model-provider/legal compliance signoff.

## Hard Blockers

### 1. Business Qualification

- Confirm whether the planned paid SaaS model requires an ICP value-added telecom business license in addition to the existing ICP filing.
- Do not start public paid operation until the required ICP filing/license path is confirmed.
- Display the ICP filing number in the website footer and link it to the MIIT filing system.
- Keep ICP subject, website name, domain, access provider, and contact information current.
- If Zingpop ships an app, mini program, quick app, or similar client, complete the required app or platform filing before public distribution.

Operational reference:

- `互联网信息服务管理办法`: commercial internet information services use a license system; non-commercial services use a filing system.
- `非经营性互联网信息服务备案管理办法`: filed non-commercial websites should display the filing number at the homepage footer and link to the MIIT filing system.
- `计算机信息网络国际联网安全保护管理办法`: websites should complete the public-security filing within the required post-launch window and display the filing mark after approval.

### 2. Product Account And SMS Completion

- Fix production database configuration and migrations before SMS debugging.
- Verify real registration with phone number, SMS code, and password.
- Verify phone-password login.
- Verify forgot-password reset with phone number, SMS code, and new password.
- Verify Huawei Cloud SMS signature, templates, Access Key, environment variables, sending limits, and error handling.
- Make auth error messages safe: they should not reveal whether a phone number exists or which internal dependency failed.

### 3. Workbench Login And Same-Origin Flow

- Verify login cookie behavior across `www.zingpop.cn` and `app.zingpop.cn`.
- Verify Nginx `auth_request` does not cause redirect loops.
- Verify logged-in users can open the workbench through `https://app.zingpop.cn`.
- Verify WebSocket, API, file browsing, and model requests through the production domain.
- Verify users never need to add `localhost:4096` or `121.36.58.22:4096`.

### 4. Public Multi-User Isolation

The core authenticated workbench isolation probe passed on 2026-05-22. Treat this as closed for the tested workbench directory/session/event attack surface, but continue broader tenant-scope verification before broad paid launch.

- Implementation checkpoint on 2026-05-21:
  - `packages/console/core/src/workbench.ts` defines the server-authorized mapping from `account_id` membership to `workspace_id -> project_id -> filesystem directory`.
  - Authenticated workbench directories now resolve to `$ZINGPOP_WORKSPACE_ROOT/<workspace_id>/projects/<project_id>` instead of `/srv/zingpop/workspaces/default`.
  - `packages/console/app/src/routes/auth/status.ts` emits the authorized `X-Opencode-Directory`, `X-Opencode-Workspace`, `X-Zingpop-Workspace-ID`, and `X-Zingpop-Project-ID` headers.
  - `deploy/nginx/zingpop-app.conf` takes those headers from `auth_request` and injects the authorized directory into proxied opencode requests.
  - Session-id routes now get an additional auth subrequest check that rejects sessions whose stored directory does not match the current authorized workspace project directory.
  - The public app host filters `/global/event` through the console auth layer and blocks shared `/sync`, `/tui`, `/global/dispose`, `/global/upgrade`, and `/instance/dispose` routes.
  - Login redirects now send users to their own workspace project directory when the app auth gate redirects through `https://app.zingpop.cn/`.
- Production verification checkpoint on 2026-05-22:
  - Commit `de409d112251ae250dd8b8a2900011db91411494` removes Zingpop workspace ids from opencode's `workspace` query routing, rejects client-supplied `workspace`, and drops client-supplied `directory` query parameters before proxying.
  - The live Nginx config was repaired from the committed template and verified with `nginx -t`.
  - The authenticated isolation probe passed for `directory=/root`, shared default directory override, another user's directory override, cross-user session id access, client `workspace` injection, and `/global/event` filtering.
  - Commit `105ea9c7974628af28dabd027ba28a01a8c3c37e` adds the repeatable `scripts/production-isolation-probe.mjs` deployment check and was cleanly deployed to production.
  - The clean production redeploy passed `nginx -t`, service restart checks, and `bun scripts/production-isolation-probe.mjs --mode all` with `ALL PRODUCTION ISOLATION PROBES PASSED`.
- Production verification checkpoint on 2026-05-25:
  - Commit `c77faff0dc80d6163c144ad6b94b50c461268034` fixes the console auth gate so `/session/status` is treated as a collection/status route, not a cross-user session id lookup.
  - Commit `19325e5f3e4ffe8e130fc48b1954f71ab1e017b9` fixes the `/session/status` Nginx proxy to forward opencode Basic Auth like the normal workbench proxy.
  - The active production config was verified with `nginx -t` and `bun scripts/production-isolation-probe.mjs --mode all`.
  - The final live result was `ALL PRODUCTION ISOLATION PROBES PASSED`, including authenticated `/session/status?directory=/root` returning HTTP `200` JSON rather than `text/html` or `401`.
- Remaining launch-gate verification:
  - Run `bun scripts/production-isolation-probe.mjs --mode all` after every future deployment.
  - Add broader end-to-end checks before reading projects, sessions, files, terminals, command execution, event streams, logs, and model-call artifacts.
  - Make every project/session/file operation tenant-scoped in production verification, not only login entry scoped.
- Keep any opencode core change out of scope unless the user explicitly approves the exact low-level tradeoff.

### 5. Personal Information And Data Compliance

Prepare and publish:

- User agreement.
- Privacy policy.
- Data processing notice.
- Account deletion and data deletion flow.
- User data export or retrieval process.
- Security incident contact and response process.

The documents must cover at least:

- Phone numbers, account identifiers, cookies, login logs, IP/device metadata, project files, prompts, model outputs, command outputs, and server logs.
- Purpose, processing method, retention period, deletion path, user rights, and support contact.
- Third-party processors such as cloud hosting, SMS provider, model providers, analytics, error monitoring, payment provider, and email provider.
- Whether user content or personal information may be sent outside mainland China through model providers or other processors.
- Whether customer code is used for training, evaluation, debugging, or product improvement. Default commercial promise should be no training on private customer code unless the user explicitly opts in.

Operational reference:

- `中华人民共和国个人信息保护法`: personal information processing requires a lawful basis, clear notice, necessary scope, user rights handling, and additional requirements for separate consent in specific scenarios.
- `中华人民共和国网络安全法`: network operators have security protection obligations, including security management, technical protection, logging, backup, and incident response.
- `中华人民共和国数据安全法`: data processing must include classification, risk monitoring, incident response, and security management measures.

### 6. Security And Secrets

- Replace any default `OPENCODE_SERVER_PASSWORD` with a strong private password.
- Revoke and recreate any GitHub token that was previously exposed.
- Keep `/etc/zingpop/zingpop.env` out of Git and restrict file permissions.
- Rotate database, SMS, model-provider, deployment, and payment credentials before public paid launch.
- Use least-privilege credentials for MySQL, SMS, cloud APIs, model providers, GitHub, and payment.
- Keep public security-group exposure limited to `80` and `443`; restrict SSH `22` to trusted source IPs only.
- Keep public `3000`, `3001`, and `4096` closed.
- Add rate limits for auth, SMS sending, project import, terminal/command execution, and model calls.
- Add audit logs for login, project access, command execution, credential changes, and admin operations.
- Keep `scripts/production-rotate-local-secrets.sh`, `scripts/production-security-check.mjs`, and provider-console rotation evidence as the launch record for secret rotation.

### 7. Open-Source And IP Review

- Keep the original MIT `LICENSE` and copyright notices.
- Add product-visible open-source notices or a third-party license page/file.
- Audit all production dependencies for GPL, AGPL, SSPL, proprietary, font, icon, image, SDK, and model-provider restrictions.
- Avoid implying official affiliation with the original opencode project.
- Replace user-facing opencode branding with Zingpop branding unless there is a deliberate attribution or license reason to keep it.
- Review generated assets, icons, fonts, screenshots, and marketing copy for commercial usage rights.

### 8. AI Service And Model Provider Compliance

- Review each model provider's commercial terms, data retention policy, abuse policy, rate limits, and privacy terms.
- Decide whether customer prompts/code/model outputs are stored, for how long, and who can access them.
- Add user-visible disclosure for third-party model processing.
- Add abuse prevention for harmful content, credential exfiltration, mass scraping, and automated attack workflows.
- If Zingpop provides generative AI services with public-opinion attributes or social mobilization capability, confirm whether security assessment, algorithm filing, or related procedures are required.
- Use `docs/model-provider-compliance.md` as the required signoff record before enabling any model provider for broad paid use.

Operational reference:

- `生成式人工智能服务管理暂行办法`: providers of generative AI services with public opinion attributes or social mobilization capability may need security assessment and algorithm filing under applicable rules.

### 9. Payments, Orders, And Customer Operations

Current payment baseline:

- Payment is not connected for production commercialization.
- Existing WeChat Pay and Alipay code paths are only implementation scaffolding until real merchant accounts, production credentials, callback URLs, and end-to-end payment tests are completed.
- Development-mode fake payment fallback and historical fake payment records do not count as real payment readiness.
- Domestic Lite/subscription checkout is not complete; the current code path still blocks Lite checkout with "Lite checkout has not been migrated to domestic payments yet".
- Legacy Stripe-based subscription and reload flows must be reviewed or replaced before relying on them for the China-market paid path.

Before accepting paying users:

- Define pricing, quotas, paid plan limits, and overage behavior.
- Complete WeChat Pay merchant onboarding and production credential configuration.
- Complete Alipay merchant onboarding and production credential configuration.
- Verify production `ALIPAY_NOTIFY_URL`, `ALIPAY_RETURN_URL`, and `WECHAT_PAY_NOTIFY_URL` are publicly reachable through HTTPS.
- Verify provider signatures using real Alipay and WeChat Pay callback payloads.
- Implement and verify order creation, pending/paid/failed/closed/refunded state transitions, duplicate callback idempotency, and amount tamper protection.
- Verify successful recharge increases the correct workspace balance exactly once.
- Implement and verify subscription plan purchase, renewal, cancellation, downgrade/upgrade, expiration, and quota enforcement.
- Implement refund request, refund callback, balance reversal or credit adjustment, and customer notification.
- Implement invoice/tax handling, including invoice request collection, issuing process, and retained invoice records.
- Add reconciliation between provider settlement records, `payment` table records, workspace balance changes, and usage cost.
- Add account suspension and abuse-handling workflow.
- Add customer support contact, complaint channel, SLA expectations, and service status communication.
- Keep billing permissions separated from engineering/admin permissions.

### 10. Reliability And Recovery

- Verify server reboot restores `nginx`, `zingpop-console`, `zingpop-opencode`, and certificate renewal timers.
- Add backups for MySQL, `/srv/zingpop`, `/etc/zingpop/zingpop.env`, Nginx configs, and deployment scripts.
- Test restore from backup before accepting paying customers.
- Add log rotation for Nginx, systemd services, auth, app errors, SMS, model calls, and payment callbacks.
- Add monitoring and alerting for service health, disk, memory, CPU, certificate expiry, database availability, SMS failures, model-provider failures, payment callback failures, and abnormal error rates.
- Prepare an incident runbook and emergency rollback path.
- Install `zingpop-backup.timer`, `zingpop-health-check.timer`, `/etc/logrotate.d/zingpop`, and the rollback procedure from `docs/security-operations.md` on the production server.

## Commercialization Checklist

- [ ] Paid SaaS qualification reviewed; ICP filing/license requirements confirmed.
- [x] ICP filing number is displayed in the website footer with the required MIIT link.
- [x] 公安联网备案 number is displayed in the website footer with the required public-security link.
- [x] Phone registration works on production.
- [ ] Phone-password login works on production.
- [ ] Forgot-password reset works on production.
- [x] Huawei Cloud Marketplace/APIG SMS production credentials and templates are verified.
- [ ] Logged-in workbench flow works through `https://app.zingpop.cn`.
- [ ] A real model request succeeds through the production workbench.
- [x] Public workbench project/workspace isolation is implemented and tested for directory, session-id, and event-stream attack surfaces.
- [x] Arbitrary server path access through client-supplied workbench `directory` is blocked.
- [x] Zingpop project table, cloud directory isolation, auth-gated project resolution, `/_zingpop/` API, and hosted local-folder picker are implemented.
- [ ] Production browser QA remains: Chrome/Edge native folder picker, upload, cloud edit, sync back, conflict handling, and two-account isolation probe.
- [ ] Broader tenant-scope verification covers files, terminals, command execution, logs, model-call artifacts, and project import/creation.
- [x] User agreement is published in the local source.
- [x] Privacy policy is published in the local source.
- [x] Data processing notice is published in the local source.
- [x] Account deletion and user data deletion flow exists in the local source.
- [x] Third-party processors and model providers are disclosed in the local source.
- [x] Default/private customer code training policy is documented in the local source.
- [ ] Production secrets are rotated and stored outside Git.
- [ ] Previously exposed GitHub tokens are revoked and recreated.
- [ ] Auth, SMS, model-call, and command-execution rate limits are active.
- [x] Deployable Nginx edge rate limits are present in the local source for app/workbench, auth, model, and general routes.
- [x] Audit logs exist for auth, SMS, project, file, manifest, and upload actions in the local source.
- [x] MIT license and original copyright notices are retained.
- [x] Dependency license audit script is present and blocks unreviewed high-risk direct dependency licenses.
- [x] Manual license-review overrides are documented for `@openauthjs/openauth` and `@solidjs/start`.
- [x] Open-source notices are published in the local source.
- [x] Zingpop branding replaces user-facing opencode branding where appropriate.
- [ ] Model provider commercial terms are reviewed.
- [x] Model provider and generative-AI compliance signoff template is present in the local source.
- [ ] Generative AI filing/security-assessment applicability is reviewed.
- [ ] WeChat Pay merchant account is approved and production credentials are configured.
- [ ] Alipay merchant account is approved and production credentials are configured.
- [ ] Production payment callback URLs are reachable over HTTPS.
- [ ] Real Alipay payment creation, callback verification, order update, and balance crediting are verified.
- [ ] Real WeChat Pay H5 payment creation, callback verification, order update, and balance crediting are verified.
- [ ] Payment duplicate callbacks, failed payments, amount mismatch, and tampered callback cases are tested.
- [ ] Subscription purchase, renewal, cancellation, expiration, and quota enforcement are implemented and tested.
- [ ] Refund flow and balance or credit reversal are implemented and tested.
- [ ] Invoice/tax handling and reconciliation workflow are ready.
- [ ] Server reboot recovery is verified.
- [ ] Backups are configured and restore-tested.
- [ ] Monitoring, alerting, log rotation, and incident response are ready.
- [x] Backup, restore-drill, health-check, logrotate, and rollback artifacts are present in the local source.

## Source Links

- MIIT `互联网信息服务管理办法`: https://gzca.miit.gov.cn/zwgk/hlwgl/art/2020/art_10348b802f064633af451a3f1f6d04a1.html
- MIIT `非经营性互联网信息服务备案管理办法`: https://www.miit.gov.cn/gyhxxhb/jgsj/cyzcyfgs/bmgz/xxtxl/art/2024/art_84a0cfa0ebd049bbbe751dca9a008e56.html
- 公安联网备案办理流程参考: https://ga.sz.gov.cn/ZT/HLWSYSQ/WSBLLC/content/post_10206896.html
- 公安联网备案政务事项参考: https://banshi.beijing.gov.cn/pubtask/task/1/110117000000/114452de-b7fe-42f1-a644-1a6756b4dbb5.html
- NPC `中华人民共和国个人信息保护法`: https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html
- MIIT `中华人民共和国网络安全法`: https://www.miit.gov.cn/ztzl/rdzt/tdzzyyhlwsdrhfzjkjstggyhlwpt/zcfb/art/2020/art_41be9e94ecc5433899ca88a0339a38b6.html
- MIIT `生成式人工智能服务管理暂行办法`: https://www.miit.gov.cn/zcfg/qtl/art/2023/art_f4e8f71ae1dc43b0980b962907b7738f.html
