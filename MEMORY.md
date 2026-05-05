# Zingpop Memory

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
