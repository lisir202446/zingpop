# Zingpop 进度叙事设计

日期：2026-06-07

## 背景

当前 Zingpop 能展示模型输出、工具调用、文件读取、编辑和命令结果，但用户看到的主要是底层执行记录。对产品用户来说，这些记录能证明系统在工作，却不能稳定回答三个问题：

- 现在正在做什么？
- 为什么正在做这一步？
- 做到哪一步了，是否卡住？

Codex 截图里的体验不是暴露模型隐藏思维链，而是产品层主动把执行过程写成用户能理解的进度叙事。Zingpop 也应该做这一层。

## 目标

采用“Codex 式外观 + 结构化事件兜底”的方案：

- 默认展示自然语言进度叙事，接近 Codex 的阅读体验。
- 用结构化工具事件生成稳定状态，避免完全依赖模型主动表达。
- 原始工具日志、命令、diff、错误输出完整保留，只默认折叠。
- 不暴露模型隐藏思维链，不展示不可验证的内部推理。
- 只在 Zingpop 产品层和应用层落地，尽量不改变 opencode 底层协议和运行路径。

## 非目标

- 不显示模型隐藏 chain-of-thought。
- 不把所有工具日志直接展开成主体验。
- 不为了这个功能改动 opencode 的核心 session/runtime 协议。
- 不把叙事写死成固定 loading 文案；它必须跟随实际工具事件变化。

## 推荐体验

每个用户请求下方新增一个“工作过程”区域，默认显示为 Codex 风格：

```text
已处理 2m 18s

我正在把“添加音效”的要求落到游戏事件上：先检查现有 HTML 的玩家、敌人和碰撞逻辑，再把射击、命中、爆炸、受伤这些节点接入 Web Audio。

已运行 4 条命令

我已经找到主要修改点，接下来会只改 shooting-game.html，避免影响其他页面。

详细执行记录 9 条
```

默认展示内容：

- 时间状态：正在处理 / 已处理 / 遇到错误 / 等待确认。
- 一到两段自然语言进度说明。
- 简短计数：探索、修改、验证、命令数量。
- 当前阶段：理解需求、探索上下文、修改文件、运行验证、等待用户、完成。
- “详细执行记录”折叠入口。

展开后展示现有工具记录：

- read/list/glob/grep 等探索记录。
- write/edit/apply_patch 等修改记录和 diff。
- bash/test/build 等验证命令和输出。
- tool error 或长时间 pending 的原始信息。

## 信息层级

主层级是给普通用户看的过程叙事：

- “我正在检查发送消息后出现全屏 Logo 的来源。”
- “当前判断是它来自应用顶层 fallback，不是消息本身失败。”
- “我会把修复放在应用壳层，避免改 opencode 底层。”
- “接下来会补测试，防止下次回归。”

次层级是结构化状态：

- 理解 1
- 探索 4
- 修改 2
- 验证 1
- 详细记录 9

第三层级才是原始工具输出。它默认收起，但必须完整可追溯。

## 结构设计

新增一个 Zingpop 产品层叙事模块：

- `packages/app/src/utils/session-progress-narrative.ts`
  - 从消息、工具 parts、session status 和时间信息生成稳定的叙事模型。
  - 纯函数，便于测试。
- `packages/app/src/pages/session/session-progress-narrative.tsx`
  - 渲染 Codex 风格进度叙事。
  - 控制默认折叠和展开详细记录。
- `packages/app/src/pages/session/message-timeline.tsx`
  - 在每个 turn 的 assistant 区域前后挂载 Zingpop 叙事组件。
  - 继续保留现有 `SessionTurn` 和 `AssistantParts` 渲染路径。

如果后续发现必须复用 `packages/ui` 的样式组件，可以只新增通用展示组件，不改变 opencode UI 的核心消息计算逻辑。

## 数据来源

前端已有可用信号：

- `session.status`：判断 idle、busy、retry、error 等会话状态。
- `message.updated`：建立用户消息和 assistant 消息。
- `message.part.updated`：拿到工具 part、文本 part、reasoning part。
- `message.part.delta`：实时更新流式文本。
- tool part 状态：
  - `pending`
  - `running`
  - `completed`
  - `error`
- tool 名称和输入输出：
  - `read`、`list`、`glob`、`grep` 归为“探索上下文”。
  - `write`、`edit`、`apply_patch` 归为“修改文件”。
  - `bash` 归为“运行验证”或“执行命令”。
  - `todowrite` 归为“规划任务”。
  - `question` 归为“等待用户确认”。

reasoning part 如果 provider 明确返回安全摘要，可以作为补充展示；如果没有返回，叙事仍然由工具事件自动生成。

## 叙事生成规则

叙事不依赖隐藏思维链，而是由事件派生：

1. 先根据工具类别决定阶段。
2. 再根据最新 running/pending 工具决定当前句。
3. 再根据已完成工具数量生成“已探索 / 已修改 / 已验证”的进度。
4. 如果 assistant 文本已经出现明确进度句，可以选取可展示摘要作为补充。
5. 如果工具长时间 pending，显示“仍在处理”，并指出正在等待的工具或命令。
6. 如果工具 error，优先显示错误状态和下一步建议。

示例映射：

- `read packages/app/src/app.tsx` -> “正在检查应用入口文件。”
- `grep Suspense packages/app/src` -> “正在搜索可能触发全屏加载的代码。”
- `edit packages/app/src/app.tsx` -> “正在修改应用壳层，避免工作台被全屏 fallback 覆盖。”
- `bash bun test ...` -> “正在运行验证，确认发送消息后不会再次闪回 Logo。”

## 长任务和卡住状态

用户最敏感的是“它到底还在做，还是停了”。因此需要明确卡住状态：

- running 超过 30 秒：显示“仍在处理”，保留当前工具名。
- running 超过 2 分钟：显示更明确的等待说明，例如“构建命令仍在运行，可能需要等待依赖安装或编译完成。”
- error：显示“遇到错误”，并展开错误摘要入口。
- session idle 但没有完成文本：显示“执行已停止，但没有生成完整结果”，提示用户继续或重试。

## 详细记录保留

详细记录不能丢。推荐行为：

- 默认折叠。
- 标题显示数量，例如“详细执行记录 9 条”。
- 点击后展示现有 `AssistantParts` / tool cards。
- 对开发者可保留完整工具输入输出、命令、diff 和错误信息。
- 普通用户无需先看这些细节，也不会被它们淹没。

## UI 行为

默认展示顺序：

1. 用户消息。
2. 工作过程叙事。
3. assistant 最终回答或阶段性回答。
4. 预览卡片。
5. 详细执行记录折叠区。

运行中：

- 叙事区域实时更新。
- 最新状态使用轻量 loading 指示，不出现全屏遮罩。
- 如果有 assistant 文本流式输出，叙事和文本可以同时存在。

完成后：

- 时间从“正在处理”变为“已处理”。
- 当前阶段变为“完成”。
- 保留本轮摘要和详细记录。

## 集成边界

实现优先放在 `packages/app`：

- 因为这是 Zingpop 产品体验，不是 opencode 底层能力。
- 不改变 opencode CLI/server 的消息协议。
- 不改变 SDK 生成路径。
- 不影响桌面端或通用 UI 的底层运行假设。

只有在样式复用有明显收益时，才考虑新增 `packages/ui` 的纯展示组件。

## 测试计划

新增单元测试覆盖叙事纯函数：

- 空工具列表时显示“正在理解需求”。
- read/list/glob/grep 映射为“探索上下文”。
- write/edit/apply_patch 映射为“修改文件”。
- bash 映射为“运行验证”。
- error 工具优先显示错误状态。
- 长时间 running 工具显示“仍在处理”。
- reasoning 缺失时仍能生成叙事。
- 原始工具记录数量正确。

新增 UI 或源码测试覆盖：

- 叙事组件出现在 assistant 详细工具记录之前。
- 详细记录默认折叠但仍可展开。
- busy 状态下显示“正在处理”。
- idle 完成后显示“已处理”。

按仓库规则，测试从 package 目录运行：

- `cd packages/app && bun typecheck`
- `cd packages/app && bun test ...`
- 如触碰 `packages/ui`，再运行对应 `packages/ui` 类型检查和测试。

## 验收标准

功能验收：

- 用户发送请求后，不再只看到“思考中”或工具流水。
- 用户能看到类似 Codex 的过程说明。
- 过程说明能随工具执行持续更新。
- 工具日志、命令、diff、错误输出没有丢失。
- 不展示隐藏思维链。
- 运行慢时能明确告诉用户当前卡在构建、读取、编辑、验证或等待模型。

产品验收：

- 默认体验接近 Codex，而不是开发日志面板。
- 普通用户能判断系统是否仍在工作。
- 高级用户仍能展开核查细节。
- Zingpop 产品层可控，后续可以继续调文案、阶段和折叠策略。

## 后续实现顺序

1. 写 `session-progress-narrative` 纯函数和测试。
2. 在 `message-timeline` 中接入叙事组件。
3. 调整详细工具记录默认层级。
4. 加入长任务和错误状态文案。
5. 本地 package 级测试。
6. 本地工作台验收。
7. 推送 GitHub。
8. 服务器按完整合并版本部署。
