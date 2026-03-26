# CLAUDE.md

## 项目信息

- 项目: AI Web Builder Mobile
- 类型: AI-native 安卓应用
- 语言: zh-CN

## 关联文档

- `docs/PRD.md` — 产品需求文档，功能边界和里程碑的唯一来源
- `PROJECT.md` — 项目结构、技术栈、启动命令，开发前必读
- `AGENTS.md` — 项目详细架构、目录结构、路由、Git/CI 规范
- `CHANGELOG.md` — 变更日志（Attempted/Completed/Reverted），每次 commit 后更新
- `TASK.json` — 任务执行台账，所有功能点和修复必须先登记

## Bug 修复闭环

1. 定位根因（代码追踪、日志分析、按需启动子代理协助）
2. 修复代码（仅改问题相关代码，不扩大范围）
3. 为修复编写或补充单元测试，覆盖触发该 Bug 的场景
4. 运行全量测试套件确认无回归
5. 若涉及 UI 变更，运行 UI 规范测试（Playwright / 视觉回归）
6. 提交 commit（`fix: 描述`）
7. 更新 CHANGELOG.md（Completed 区）

## 功能开发闭环

1. 实现功能代码
2. 为新功能编写单元测试，覆盖核心路径和边界情况
3. 运行全量测试套件确认通过
4. 若涉及 UI 变更，运行 UI 规范测试（Playwright / 视觉回归）
5. 提交 commit（`feat: 描述`）
6. 更新 CHANGELOG.md（Completed 区）

## 测试标准

- 每个功能点和修复必须有对应的单元测试，不允许跳过
- 前端 UI 变更必须有 UI 规范测试或截图对比
- 测试未通过不允许提交 commit
- "只编译通过"不等于"测试通过"
- 单测全部通过后，删除本次生成的测试文件（测试仅用于验证闭环，不持久保留）

## 自主决策原则

- Claude 自行判断当前任务需要哪些 Skill、MCP 工具、子代理
- 优先搜索已安装的 Skill；不足时使用 find-skill 搜索；安装需用户批准
- Claude 自行决定是否启动子代理并行处理（测试代理、审查代理、探索代理等）
- Claude 自行选择最合适的调试、测试、构建工具，不限定具体命令
- 所有决策基于项目实际技术栈和当前上下文，而非固定模板

## 提交规范

- 每完成一个功能点或修复即提交一次 commit
- 使用中文 Conventional Commits: `<type>: <描述>`
- type: feat / fix / refactor / docs / test / chore
- 禁止 `git push --force` 到 master

## 文档同步

- 每次 commit 后更新 CHANGELOG.md
- 项目结构变更时更新 PROJECT.md 和 AGENTS.md
- PRD 变化时同步更新 docs/PRD.md

## 代码规范

- 注释和日志使用中文
- 包管理器: pnpm
- 箭头函数优先
