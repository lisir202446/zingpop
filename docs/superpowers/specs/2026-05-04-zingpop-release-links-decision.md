# Zingpop 发布链接决策记录

日期：2026-05-04

## 当前决策

上线前暂时不要替换底层发布链路。

已经完成的品牌替换只覆盖不影响运行的展示层，包括 logo、页面标题、错误页文案、帮助入口、反馈入口、通知图标等。

## 暂不替换的链接类型

- CLI 安装脚本链接，例如 `https://opencode.ai/install`
- 桌面自动更新清单，例如 GitHub Release 的 `latest.json` / `latest.yml`
- 桌面更新包、安装包、CLI sidecar 下载包
- Tauri / Electron updater endpoint

## 原因

这些链接属于发布基础设施，不只是用户可见跳转。只有在 Zingpop 自己的服务器或 Release 仓库已经提供对应文件后，才能切换。

如果只把 URL 改成 `zingpop.ai`，但服务器上没有相同格式的安装脚本、版本文件、签名信息、hash 和更新包，会导致：

- CLI 安装失败
- 桌面自动更新检查失败
- 更新包下载失败
- CLI sidecar 下载失败
- Windows / macOS 签名或校验失败

## 上线前再处理

上线前如果要把发布链路切到 Zingpop，需要先准备：

- `https://zingpop.ai/install` 安装脚本
- 各平台 CLI / sidecar 二进制包
- 桌面安装包和更新包
- updater 需要的 `latest.json` / `latest.yml`
- 对应的 hash、签名和版本号

准备好并完成安装、启动、自动更新验证后，再把代码里的发布链接从 OpenCode 源切到 Zingpop。
