# Agent Harness

## Why

Anthropic 在《Effective harnesses for long-running agents》中强调，长时运行 agent 的关键不是让 agent 一直“记住一切”，而是把初始化、特性列表、进度桥接和端到端验证沉淀为外部工件。这个仓库已经具备其中大部分基础设施：

- `openspec/changes/*`：initializer agent 的需求和设计上下文
- `TASK.json`：结构化 task ledger
- `openspec/changes/<change>/logs/*.jsonl`：跨会话进度桥
- `Playwright / Vitest / pnpm build`：每轮交付的真实验证门禁

缺少的是把这些工件自动串成“下一步做什么”的 harness 层。

## What The Harness Adds

### 1. Initializer Harness

`pnpm agent:init`

生成：

- `.agent-harness/feature-list.json`
- `.agent-harness/init.md`

作用：

- 把现有 `TASK.json + OpenSpec` 压缩成一个 agent 可消费的 feature list
- 明确 session 固定启动顺序

### 2. Session Bearings

`pnpm agent:refresh`

生成：

- `.agent-harness/session-brief.md`

作用：

- 给当前 session 一个低 token、可恢复的起点
- 自动列出当前 focus task、必读文件、必跑验证命令、后续队列和 repo backlog

### 3. Orchestration Decision

`pnpm agent:orchestrate`

生成：

- `.agent-harness/orchestration.json`

作用：

- 自动挑选当前最应该推进的 task
- 优先级规则：
  - 活跃 change 优先
  - `todo` 优先
  - `P0` 高于 `P1`
  - `delivery` 先于 `closure`
  - 同 change 内按 task 编号推进

### 4. Session Progress Bridge

`pnpm agent:log -- <event> <task-id> "<summary>" --verification "<command/result>" --next "<next step>"`

写入：

- `.agent-harness/progress.jsonl`

作用：

- 记录 session 级检查点
- 不替代 task log，只补 session 视角的“为什么切换、下一步是什么”

## Recommended Flow

1. `pnpm agent:init`
2. `pnpm agent:refresh`
3. 阅读 `.agent-harness/session-brief.md`
4. 阅读当前 focus task 的 `mustRead` 文件
5. 只推进一个 atomic task
6. 跑 task 上声明的验证命令
7. 用 `pnpm agent:log` 记录 start/checkpoint/done
8. 提交 commit
9. 再次执行 `pnpm agent:refresh`

## Why This Repo Reuses Existing Tools

没有额外引入新的任务系统，因为当前仓库已经有强约束工件：

- OpenSpec 负责定义
- `TASK.json` 负责 task 级编排
- task logs 负责跨会话证据
- Playwright / Vitest / build 负责完成定义

新的 harness 只做“读取、排序、压缩、桥接”，不重复发明状态源。
