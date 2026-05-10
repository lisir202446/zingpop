# Zingpop 项目状态文档

> 供 AI 助手（Claude Code、Codex 等）快速上手用。
> 最后更新：2026-05-02

---

## 一、项目是什么

**Zingpop** 是 [OpenCode](https://github.com/anomalyco/opencode)（开源 AI 编程助手）的 Fork + 重品牌版本。

核心改动方向：把面向开发者的 AI Coding Agent，重新定位为**面向不会写代码的普通中国用户**的 AI 创作工具。

- 品牌名：Zingpop
- 底层引擎：OpenCode（MIT 开源，完整继承）
- 目标用户：有创意但不懂代码的人，想做小游戏、个人主页、小工具、艺术展示
- 核心差异：预置 skill/prompt/context，用户不需要从空白开始

### 本地代码目录
```
D:\我的桌面文件\zingpop-new\
```

### 服务器
```
华为云 ECS，Ubuntu 24.04
公网 IP：121.36.58.22
内网 IP：172.31.4.196
项目路径：/root/zingpop
```

---

## 二、技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Solid.js + SolidStart + Vite + Tailwind CSS |
| 后端 | Hono (Cloudflare Workers 模式，本地用 Node 跑) |
| 数据库 ORM | Drizzle ORM + MySQL (mysql2) |
| 数据库 | MySQL 8.0，本地安装在 ECS 上（127.0.0.1:3306，库名 opencode） |
| 包管理 | Bun |
| Monorepo | Turbo |
| AI SDK | Vercel AI SDK（支持 30+ 模型） |
| 短信 | 华为云短信（代码已写，凭证未配置） |
| 支付 | 微信支付 H5 + 支付宝（代码已写，商户号未配置） |
| 邮件 | AWS SES（硬编码，需要改造，见下文） |
| 文件存储 | Cloudflare R2（代码写的，需小改支持华为 OBS） |

---

## 三、关键包结构

```
packages/
├── console/
│   ├── app/          # 前端（SolidStart），端口 4323
│   ├── core/         # 后端业务逻辑（auth、billing、usage 等）
│   ├── function/     # Cloudflare Worker 函数
│   ├── mail/         # 邮件模板（JSX Email）
│   └── resource/     # SST 资源定义
├── opencode/         # CLI / TUI 核心 Agent
├── desktop-electron/ # Electron 桌面应用
├── enterprise/       # 企业版（含文件存储抽象层）
└── sdk/              # OpenCode SDK
```

---

## 四、当前服务器运行状态

### 进程（2026-05-02 现状）
```
bun dev --host 0.0.0.0 --port 4323          ← ⚠️ 开发模式，需要改成生产
bun run packages/opencode src/index.ts serve ← OpenCode 后端
node vite dev --port 4323                   ← ⚠️ Vite 开发服务器，需要换掉
```

### 数据库（2026-05-02 快照）
```
账号数：1（测试账号，手机号登录）
工作区：2
AI 调用：0（usage 表为空）
支付记录：1 笔（支付宝 $20，这是开发模式假数据，非真实支付）
订阅：无
```

### 环境变量（/root/zingpop/.env）
```env
DATABASE_URL=mysql://root@127.0.0.1:3306/opencode
APP_STAGE=development        ← 需要改成 production
NODE_ENV=development         ← 需要改成 production
ZEN_SESSION_SECRET=local-dev-session-secret-32chars  ← 需要换成强随机值
```

---

## 五、已完成的工作

### 功能开发
- [x] OpenCode 完整引擎（CLI / TUI / 桌面 / Console Web）
- [x] Zingpop 品牌改造（console 所有界面）
- [x] 面向新手的首页（案例展示区、理念区、FAQ、三步开始）
- [x] 首页配套 4 张 AI 生成案例图（game/site/tool/art）
- [x] 简体/繁体中文 i18n（共 20+ 语言）
- [x] 手机号验证码登录（`packages/console/core/src/phone-auth.ts`，逻辑完整）
- [x] 华为云短信集成（`packages/console/core/src/sms.ts`，代码完整，凭证待填）
- [x] 微信支付 H5（`packages/console/core/src/pay/wechat.ts`，代码完整，凭证待填）
- [x] 支付宝支付（`packages/console/core/src/pay/alipay.ts`，代码完整，凭证待填）
- [x] 开发环境假支付 fallback（stage=development 时跳过真实支付）
- [x] 开发环境假短信 fallback（stage=development 时返回验证码不发短信）
- [x] 数据库迁移（20 张表全部建好）
- [x] 诊断 SQL 脚本（`scripts/db-check.sql`，本地 Windows 有，服务器暂无）

### 基础设施
- [x] 华为云 ECS 服务器部署（Ubuntu 24.04）
- [x] MySQL 8.0 本地安装，数据库 `opencode` 已建
- [x] ICP 备案申请中（域名暂时无法使用）

---

## 六、待完成的工作

### 6.1 前端改动（进行中）

用户正在修改前端页面，**等前端改完再做生产部署**。

改完后执行生产部署三步曲（见 6.2）。

---

### 6.2 生产部署（前端改完后执行）

**第一步：构建**
```bash
cd /root/zingpop
# 修改环境变量
sed -i 's/APP_STAGE=development/APP_STAGE=production/' .env
sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
# 构建前端
bun run --cwd packages/console/app build
```

**第二步：pm2 进程守护**
```bash
npm install -g pm2
kill $(ps aux | grep -E "vite|bun dev" | grep -v grep | awk '{print $2}')
pm2 start "bun run --cwd /root/zingpop/packages/console/app start" --name zingpop-console
pm2 start "bun run --cwd /root/zingpop/packages/opencode --conditions=browser src/index.ts serve" --name zingpop-opencode
pm2 save
pm2 startup  # 执行输出的那条命令
```

**第三步：Nginx 反向代理**
```bash
apt install -y nginx
cat > /etc/nginx/sites-available/zingpop << 'NGINX'
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;
    access_log /var/log/nginx/zingpop.access.log;
    error_log  /var/log/nginx/zingpop.error.log;
    location / {
        proxy_pass         http://127.0.0.1:4323;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/zingpop /etc/nginx/sites-enabled/zingpop
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl start nginx && systemctl enable nginx
```

华为云安全组需开放 TCP 80 端口（0.0.0.0/0）。

---

### 6.3 域名 + HTTPS（备案通过后执行）

备案通过后：
```bash
# 替换 nginx 配置里的 server_name
sed -i 's/server_name _;/server_name your-domain.com www.your-domain.com;/' \
  /etc/nginx/sites-available/zingpop

# 申请 Let's Encrypt 证书
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com

nginx -t && systemctl reload nginx
```

---

### 6.4 环境变量补全（需要申请对应商户/服务账号）

```env
# 生产必填
APP_STAGE=production
NODE_ENV=production
ZEN_SESSION_SECRET=<随机32位以上字符串>

# 华为云短信（去华为云短信服务申请）
HUAWEI_SMS_ENDPOINT=https://smsapi.cn-north-4.myhuaweicloud.com
HUAWEI_SMS_APP_KEY=<应用Key>
HUAWEI_SMS_APP_SECRET=<应用Secret>
HUAWEI_SMS_SENDER=<签名通道号>
HUAWEI_SMS_TEMPLATE_ID=<验证码模板ID>
HUAWEI_SMS_SIGNATURE=<短信签名>

# 微信支付（去微信支付商户平台申请，需营业执照）
WECHAT_PAY_APP_ID=<APPID>
WECHAT_PAY_MCH_ID=<商户号>
WECHAT_PAY_SERIAL_NO=<API证书序列号>
WECHAT_PAY_PRIVATE_KEY=<API私钥内容>
WECHAT_PAY_PLATFORM_CERT=<平台证书内容>
WECHAT_PAY_V3_KEY=<APIv3密钥>
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/pay/wechat/notify

# 支付宝（去支付宝开放平台申请，需营业执照）
ALIPAY_APP_ID=<应用ID>
ALIPAY_PRIVATE_KEY=<应用私钥>
ALIPAY_PUBLIC_KEY=<支付宝公钥>
ALIPAY_NOTIFY_URL=https://your-domain.com/api/pay/alipay/notify
ALIPAY_RETURN_URL=https://your-domain.com/pay/success

# AI 模型（按需配置，支持通义千问/Moonshot/DeepSeek 等）
# 任意 OpenAI 兼容接口均可直接配置，无需改代码
ALIBABA_API_KEY=<通义千问API Key>
# OPENAI_API_KEY=<如果用 OpenAI>
```

---

### 6.5 代码层面还需要修改的两处

#### 问题 1：邮件硬编码 AWS SES（约 200 行改动）

**文件**：`packages/console/core/src/aws.ts`

**问题**：邮件发送 endpoint 硬写 `https://email.us-east-1.amazonaws.com`，发件地址硬写 `contact@anoma.ly`，没有 SMTP 支持。

**需要做的**：
1. 提取邮件 provider 接口
2. 加一个 SMTP 实现（用 nodemailer）
3. 通过 `EMAIL_PROVIDER=smtp` 环境变量切换
4. 现有两处调用点（`user.ts`、`enterprise.ts`）不需要改

**需要新增环境变量**：
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=<国内邮件服务商>
SMTP_PORT=465
SMTP_USER=<发件邮箱>
SMTP_PASS=<密码>
EMAIL_FROM=Zingpop <noreply@your-domain.com>
```

---

#### 问题 2：文件存储不支持华为 OBS（约 10 行改动）

**文件**：`packages/enterprise/src/core/storage.ts`

**问题**：S3 模式的 endpoint 硬写 `https://s3.${region}.amazonaws.com`，没有自定义 endpoint 入口。

**需要做的**：在 adapter 选择逻辑里加一个 `s3-compatible` 分支：
```typescript
// 在 lazy(() => { ... }) 里加：
if (type === "s3-compatible") {
  const endpoint = process.env.OPENCODE_STORAGE_ENDPOINT!
  const client = new AwsClient({
    accessKeyId: process.env.OPENCODE_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OPENCODE_STORAGE_SECRET_ACCESS_KEY!,
  })
  return createAdapter(client, endpoint, process.env.OPENCODE_STORAGE_BUCKET!)
}
```

**需要新增环境变量**：
```env
OPENCODE_STORAGE_ADAPTER=s3-compatible
OPENCODE_STORAGE_ENDPOINT=https://obs.cn-north-4.myhuaweicloud.com
OPENCODE_STORAGE_BUCKET=<桶名>
OPENCODE_STORAGE_ACCESS_KEY_ID=<AK>
OPENCODE_STORAGE_SECRET_ACCESS_KEY=<SK>
```

---

### 6.6 合规事项（非代码）

| 事项 | 状态 |
|---|---|
| ICP 备案 | 🔄 进行中 |
| 营业执照 | ❓ 未确认（微信支付/支付宝申请需要） |
| 微信支付商户申请 | ❌ 未开始 |
| 支付宝商户申请 | ❌ 未开始 |
| 华为云短信模板审批 | ❌ 未开始 |
| 隐私政策国内合规版 | ❌ 未做（PIPL 要求） |

---

## 七、数据库诊断脚本

脚本在 `scripts/db-check.sql`（本地 Windows 路径有，服务器还没有）。

服务器上快速跑诊断：
```bash
mysql -u root opencode << 'SQL'
SELECT COUNT(*) AS 总账号数 FROM account WHERE time_deleted IS NULL;
SELECT COUNT(DISTINCT account_id) AS 近30日活跃 FROM user
  WHERE time_seen >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND time_deleted IS NULL;
SELECT COUNT(*) AS AI总调用次数, ROUND(SUM(cost)/100000000,4) AS 总花费_USD FROM `usage`;
SELECT channel, status, COUNT(*) AS 笔数, ROUND(SUM(IFNULL(paid_amount,0))/100000000,2) AS 金额_USD
  FROM payment GROUP BY channel, status;
SQL
```

---

## 八、AI 模型接入说明

代码使用 Vercel AI SDK，**完全配置驱动，不需要改代码**。

- 阿里通义千问：设置 `ALIBABA_API_KEY` 即可，原生支持
- Moonshot/Kimi：已在测试 fixtures 中配置
- 其他国内厂商（DeepSeek、百度文心、讯飞等）：均支持 OpenAI 兼容模式，设置 baseURL 即可
- 模型来源优先级：`OPENCODE_MODELS_URL` 环境变量 > 本地 `opencode.jsonc` > models.dev 在线

---

## 九、当前最高优先级任务

1. **【进行中】** 前端页面修改
2. **【等前端完成】** 生产部署（pm2 + nginx，见 6.2）
3. **【需要商户账号】** 微信支付 + 支付宝真实凭证配置
4. **【需要账号】** 华为云短信凭证配置
5. **【需要写代码】** 邮件服务改造（aws.ts，约 200 行）
6. **【备案通过后】** 域名绑定 + HTTPS 证书
7. **【需要写代码】** 文件存储支持华为 OBS（storage.ts，约 10 行）

# 2026-05-10 Codex 状态补充

当前生产域名链路已经上线：

- 公网 IP：`121.36.58.22`
- 服务器规格：`4 vCPU / 8 GiB`
- `https://www.zingpop.cn`：产品首页，当前 HTTP 状态 `200`
- `https://zingpop.cn`：根域名，当前 HTTP 状态 `200`
- `https://app.zingpop.cn`：工作台入口，未登录时 `302` 到 `https://www.zingpop.cn/auth/phone`
- `zingpop-console.service`：运行在 `127.0.0.1:3000`
- `zingpop-opencode.service`：运行在 `127.0.0.1:4096`
- Nginx：公网只通过 `80/443` 对外
- 证书：`www.zingpop.cn`/`zingpop.cn` 和 `app.zingpop.cn` 均已签发，`certbot renew --dry-run` 成功
- 安全组：公网保留 `80/443`，SSH `22` 限制到用户固定 IP，临时公网 `3000/3001/4096` 应保持关闭

当前已经完成的部署关键点：

- ICP 备案已完成。
- ECS 已升级，生产构建已在服务器通过。
- `scripts/production-build.sh` 会清理旧 `.nitro` 并拒绝包含 `@manifest` 的坏产物。
- `scripts/install-systemd.sh` 会在安装前检查 console 产物。
- `packages/console/app/vite.config.ts` 在 `NITRO_PRESET=node_server` 时强制生产环境 define，避免 SolidStart dev SSR manifest 混入生产构建。

当前仍需要优先检查：

1. 用户浏览器无法打开前端链接时，先排查客户端 DNS / 代理 / 浏览器缓存；Windows 代理环境下 `nslookup` 可能显示 `198.18.0.x` fake-IP。
2. 真实手机号注册、手机号密码登录、忘记密码重置流程。
3. 华为云短信变量和模板：
   - `HUAWEI_SMS_ENDPOINT`
   - `HUAWEI_SMS_APP_KEY`
   - `HUAWEI_SMS_APP_SECRET`
   - `HUAWEI_SMS_SENDER`
   - `HUAWEI_SMS_TEMPLATE_ID`
   - `HUAWEI_SMS_SIGNATURE`
4. `/etc/zingpop/zingpop.env` 中的 `DATABASE_URL` 或 `MYSQL_*` 是否为真实生产 MySQL 配置。
5. 登录后进入 `https://app.zingpop.cn` 并完成一次真实模型调用。
6. 首页页脚是否展示 ICP 备案号。
7. MySQL、`/srv/zingpop`、`/etc/zingpop/zingpop.env` 的备份策略。
8. 面向公开多用户前，必须完成用户 workspace / session / file / terminal 隔离。

2026-05-10 追加：短信和用户登录还没有完成闭环。`/auth/phone` 页面可以打开，但发送注册验证码时显示“认证服务暂不可用”。按当前代码，这个错误优先指向数据库配置或迁移未就绪；如果只是短信没配置，页面应显示“短信服务尚未配置”。下一步先检查 `/etc/zingpop/zingpop.env` 里的 `DATABASE_URL` / `MYSQL_*` 和 MySQL 表 `login_code`、`account_password`，再配置华为云短信变量。
