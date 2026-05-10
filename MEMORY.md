# Zingpop Memory

## Opencode integration boundary

Date: 2026-05-06

Hard rule for all future work: do not change opencode's reusable bottom-layer runtime/core behavior unless the user explicitly approves that exact low-level change.

- Reuse existing opencode capabilities whenever available.
- Prefer additive Zingpop-side work: configuration, deployment scripts, Nginx, systemd, environment variables, wrapper scripts, docs, or Zingpop-only integration layers.
- Before editing `packages/opencode/src`, check whether opencode already has the needed capability.
- Preserve the existing opencode CLI/server run path, SDK generation, project/session/file routing, desktop runtime, and web runtime assumptions.
- If a production feature cannot be completed without opencode core changes, stop and explain the tradeoff before editing.

## Production status

Date: 2026-05-10

Current public production path is live on Huawei Cloud:

- Server public IP: `121.36.58.22`.
- ECS/Flexus specification has been upgraded to `4 vCPU / 8 GiB`.
- ICP filing is complete for `zingpop.cn`.
- DNS records are configured for `zingpop.cn`, `www.zingpop.cn`, and `app.zingpop.cn`.
- Let's Encrypt certificates are active:
  - `www.zingpop.cn` certificate also covers `zingpop.cn`.
  - `app.zingpop.cn` has its own certificate.
- `certbot renew --dry-run` succeeded on 2026-05-10.
- Nginx is the only public entry for app traffic:
  - `80` redirects to HTTPS.
  - `443` serves HTTPS.
  - `127.0.0.1:3000` serves the product home/auth console.
  - `127.0.0.1:4096` serves the opencode workbench backend.
- `zingpop-console.service`, `zingpop-opencode.service`, and `nginx.service` are active and enabled.
- Security group has been tightened:
  - Public `80` and `443` remain open.
  - SSH `22` is restricted to the user's fixed IP.
  - Public `3000`, `3001`, and `4096` should remain closed.
- Verified server responses:
  - `http://www.zingpop.cn` -> `301`
  - `https://www.zingpop.cn` -> `200`
  - `https://zingpop.cn` -> `200`
  - `https://app.zingpop.cn` -> `302` to `https://www.zingpop.cn/auth/phone` when not logged in.
- Console production build guard is in place:
  - `scripts/production-build.sh` cleans stale `.nitro` output and rejects `@manifest` dev SSR artifacts.
  - `scripts/install-systemd.sh` refuses to install console output containing `@manifest`.
  - `packages/console/app/vite.config.ts` forces `import.meta.env.DEV=false` and `import.meta.env.PROD=true` for `NITRO_PRESET=node_server`.

Browser issue note:

- If the user says the frontend link cannot open while server `curl` returns `200`, first check client-side DNS/proxy/browser behavior.
- On Windows with proxy tools, `nslookup` may return `198.18.0.x` fake-IP values. That can be normal for proxy DNS mode, but browser rules may still block or misroute the request.
- Ask for the exact browser error page and run:

```powershell
curl.exe -I https://www.zingpop.cn/
curl.exe -I https://zingpop.cn/
curl.exe -I https://app.zingpop.cn/
nslookup www.zingpop.cn 223.5.5.5
nslookup app.zingpop.cn 223.5.5.5
```

Still remaining before wider public use:

- Verify real phone registration, phone-password login, and forgot-password reset on the server.
- Configure and verify Huawei Cloud SMS credentials and approved templates.
- Confirm MySQL production credentials in `/etc/zingpop/zingpop.env`.
- Test model provider API keys and a real workbench request.
- Add/display ICP filing number in the website footer if not already present.
- Add backup jobs for MySQL, `/srv/zingpop`, and `/etc/zingpop/zingpop.env`.
- Complete public multi-user project/workspace isolation before allowing untrusted users.
- Prepare user agreement, privacy policy, data processing notes, and open-source notices.

## Production deployment path

Date: 2026-05-06

Use the existing opencode production build and embedded Web UI for the workbench:

- Workbench production host should be `https://app.zingpop.cn`.
- Product home should be `https://www.zingpop.cn`.
- `app.zingpop.cn` should proxy to local `127.0.0.1:4096`.
- The current `www.zingpop.cn` certificate does not cover `app.zingpop.cn`; issue a separate app cert or a wildcard cert after ICP allows domain use.
- The browser workbench auto-connects by using `location.origin`; users should not manually add `localhost:4096` or `121.36.58.22:4096`.
- Keep domain traffic disabled until ICP filing is complete if Huawei Cloud instructed not to use the domain during filing.
- Use `scripts/production-build.sh` on the Linux server to build the opencode binary.
- Use `scripts/install-systemd.sh` to install the `zingpop-opencode` service template.
- The systemd service should run `/opt/zingpop/bin/opencode`, copied from the server build output, not a symlink into `/root`.
- Use `/srv/zingpop/workspaces/default` for single-tenant staging only.
- Before public multi-user launch, add product-level user accounts, project ownership, and authorization/isolation checks.

## Pre-ICP launch preparation

Date: 2026-05-07

Do not use an unfiled replacement domain before ICP is complete. Until ICP filing allows public domain traffic, keep domain access disabled and use the server public IP only for internal testing.

Current pre-ICP work plan:

- Run the production build on the server:

```bash
cd /root/zingpop
chmod +x scripts/production-build.sh scripts/install-systemd.sh
./scripts/production-build.sh
```

- Confirm the Linux opencode binary builds successfully.
- Current server sizing decision:
  - Do not upgrade the Huawei Cloud ECS/Flexus specification while ICP filing is still pending.
  - Before public launch after ICP approval, temporarily or permanently upgrade to at least `4 vCPU / 8 GiB` and rerun the full production build.
  - Reason: the current `3.4 GiB` memory server can run the built opencode backend, but `packages/console/app` production build has failed with `Killed vite build` / exit code `137`, which indicates memory pressure.
  - If the Huawei Cloud plan list offers both `2 vCPU / 8 GiB` and `4 vCPU / 8 GiB`, choose `4 vCPU / 8 GiB` when it is cheaper or comparable. `4 vCPU / 16 GiB` is not required unless builds still fail after 8 GiB.
- Install and start the systemd service:

```bash
./scripts/install-systemd.sh
systemctl enable --now zingpop-opencode
systemctl status zingpop-opencode --no-pager
```

- Configure `/etc/zingpop/zingpop.env` before starting production service.
- The production workbench backend should listen on `127.0.0.1:4096`, not public `0.0.0.0:4096`.
- Continue internal IP testing with:

```text
http://121.36.58.22:3000
http://121.36.58.22:3001
http://121.36.58.22:4096
```

- Test phone registration, phone-password login, and forgot-password reset:

```text
Register: phone + SMS code + password
Login: phone + password
Forgot password: phone + SMS code + new password
```

- Verify Huawei Cloud SMS templates, signature, Access Key, and environment variables can send codes.
- Prepare Nginx configs under `/etc/nginx/sites-available` and run `nginx -t`, but do not enable public domain traffic before ICP is ready.
- Final production security group should expose only `80` and `443`; restrict SSH `22` to the user's fixed IP. Keep `3000`, `3001`, and `4096` public only during temporary internal testing.
- Prepare user agreement, privacy policy, data processing notes, third-party open-source notices, and dependency license audit.
- Continue multi-user isolation design before public launch:
  - Define where each user's project directory lives.
  - Define who can access each project, session, and file.
  - Prevent users from entering raw server paths such as `/root/zingpop`.

## Product login decision

Date: 2026-05-06

Use phone-first product authentication:

- First registration: phone number + SMS verification code + set password.
- Later login: phone number + password.
- Forgot password: phone number + SMS verification code + set new password.
- Reuse existing phone verification/account creation code in `packages/console/core/src/phone-auth.ts` and `packages/console/app/src/routes/auth/phone.tsx`.
- Product-layer password table and password hashing flow are in `packages/console/core/src/schema/account_password.sql.ts` and `packages/console/core/src/password-auth.ts`.
- Product phone login/register/reset UI is in `packages/console/app/src/routes/auth/phone.tsx`.
- `deploy/nginx/zingpop-app.conf` uses `auth_request` to protect `app.zingpop.cn` before proxying to opencode.
- Set `AUTH_COOKIE_DOMAIN=.zingpop.cn` in production so the login cookie works across `www.zingpop.cn` and `app.zingpop.cn`.
- Do not put this inside opencode core.
- See `docs/auth-phone-password.md`.

## Commercial launch reminder

Date: 2026-05-06

Before any public commercial launch, remind the user to complete the open-source and legal readiness review:

- opencode is MIT licensed in this repository, so commercial use is generally allowed.
- Keep the original MIT LICENSE text and copyright notices.
- Add open-source notices / third-party license acknowledgements to the product.
- Audit dependencies for restrictive licenses such as GPL or AGPL.
- Review terms for model providers, APIs, SDKs, fonts, icons, images, and hosted services.
- Avoid implying official affiliation with the original opencode project.
- Prefer Zingpop branding in user-facing surfaces; review use of opencode name/logo before launch.
- Prepare user agreement, privacy policy, data security terms, and data handling disclosures before processing real user code or business data.

Also check `docs/production-readiness.md` before launch.

## 发布链接暂不替换

日期：2026-05-04

当前只替换不影响底层运行的展示层品牌：logo、页面标题、错误页文案、帮助入口、反馈入口、通知图标等。

上线前暂时不要替换底层发布链路，包括：

- CLI 安装脚本链接，例如 `https://opencode.ai/install`
- 桌面自动更新清单，例如 GitHub Release 的 `latest.json` / `latest.yml`
- 桌面更新包、安装包、CLI sidecar 下载包
- Tauri / Electron updater endpoint

原因：这些链接依赖真实发布基础设施。只有当 Zingpop 自己的服务器或 Release 仓库已经提供相同格式的安装脚本、版本文件、hash、签名和更新包后，才能把发布链接切到 `zingpop.ai` 或 Zingpop Release。

上线前再考虑这件事。切换前必须先验证：CLI 安装、桌面启动、自动更新检查、更新包下载、sidecar 下载、Windows/macOS 签名或校验全部正常。
