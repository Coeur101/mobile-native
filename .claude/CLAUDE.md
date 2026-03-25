# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Tool Usage Protocol (工具调用输出协议 - 硬性要求)

**每次调用任何工具时，必须在输出中以 `[${tool_name}]` 开头声明工具名称和用途。**

格式：`[工具名称] 用途描述`

示例：
- `[Read] 读取 src/main.ts 了解入口文件结构`
- `[Bash] 运行 pnpm lint 检查代码质量`
- `[Agent:backend-dev] 启动后端开发代理处理用户模块`
- `[Skill:vue-best-practices] 加载 Vue 最佳实践技能`
- `[MCP:context7] 查询 Drizzle ORM 最新文档`

此规则适用于所有工具调用，包括但不限于：Read、Write、Edit、Bash、Glob、Grep、Agent、Skill、MCP 工具。

## Skill & MCP Scan Protocol (技能与MCP扫描协议 - 硬性要求)

**每次接收到修改类任务时，必须先扫描可用的 Skill 和 MCP 工具，确定本次任务应使用哪些技能和 MCP。**

### 扫描时机

1. **任务开始时**: 分析任务类型，列出将要使用的 Skill 和 MCP 工具
2. **文件修改前**: 确认修改目标文件类型对应的技能已加载
3. **遇到新领域时**: 如发现任务涉及未扫描的技术领域，立即补充扫描

### 扫描输出格式

```
[Skill/MCP 扫描结果]
- 适用技能: skill-name-1, skill-name-2, ...
- 适用 MCP: mcp-name-1, mcp-name-2, ...
- 不适用/无需加载: 原因说明
```

### 扫描规则

- 根据文件类型自动匹配：`.vue` → Vue 相关技能，`.ts`(后端) → NestJS 相关技能，数据库相关 → Drizzle 技能
- 根据任务类型匹配：UI 开发 → frontend-design，调试 → systematic-debugging，测试 → TDD 技能
- MCP 工具按需使用：数据库操作 → PostgreSQL MCP，前端测试 → Playwright MCP，查文档 → Context7 MCP，Ant Design → antd-components MCP

## Project Documentation

Each sub-project maintains its own documentation:

- **AGENTS.md** — Project overview: tech stack, module structure, core workflows, API endpoints, development commands, code conventions
- **CHANGELOG.md** — Change history: feature additions, bug fixes, refactoring (maintained by AI)

Read the relevant AGENTS.md file before starting work on a project to understand its architecture, conventions, and available sub-agents.

## Sub-Agents (子代理系统)

项目可配置专用子代理，定义文件位于 `.claude/agents/`。

### 使用原则

- 根据任务类型从 `.claude/agents/` 目录中选择合适的子代理
- 子代理的具体类型、用途、权限参见各代理定义文件
- 子代理工作时应根据任务涉及的技术栈自动触发对应 Skill（参考 Skill & MCP Scan Protocol）

### 常见协作模式

- **前后端并行开发**: 同时启动前端 + 后端代理处理同一功能
- **Schema 变更**: 先用数据库代理设计，再用后端代理适配
- **代码审查**: 先用审查代理检查，再用开发代理修复
- **影响分析**: 先用探索代理分析，再分配给开发代理

## Hooks (自动检查)

项目可配置 PostToolUse Hook，每次通过 Edit 或 Write 工具修改文件后自动运行代码检查。

- 配置文件: `.claude/settings.local.json`
- 脚本文件: `.claude/hooks/` 目录

Hook 根据文件类型和项目类型自动执行相应检查（lint、type-check、test 等）。非源码文件修改不会触发检查。检查失败时 Hook 返回非零退出码。

## Feature Development Closed-Loop (功能开发闭环 - 硬性要求)

**所有功能开发必须完成以下闭环流程**：

1. **开发 (Development)**: 实现功能代码
2. **调试 (Debug)**: 验证代码编译通过，Hook 检查通过
3. **测试 (Test)**: 验证功能可正常工作（API 测试 / UI 测试 / 数据验证）
4. **修复 (Fix)**: 发现问题立即修复，重新测试
5. **提交 (Commit)**: Git commit 提交代码变更
6. **更新日志 (Changelog)**: 在项目的 CHANGELOG.md 中追加变更记录

**禁止行为**：

- 只完成部分功能就提交
- 不进行功能测试直接提交
- 不提交 Git commit
- 不更新 CHANGELOG.md

## Bug Fix Closed-Loop (Bug 修复闭环 - 硬性要求)

**所有 Bug 修复必须完成以下闭环流程**：

1. **定位 (Locate)**: 通过代码追踪、日志分析、子代理研究定位根因
2. **修复 (Fix)**: 仅修改问题相关代码，不扩大修改范围
3. **验证 (Verify)**: 修复后必须通过项目的 lint + test + build 检查
4. **提交 (Commit)**: Git commit 提交，commit message 以 `fix:` 开头
5. **更新日志 (Changelog)**: 在项目的 CHANGELOG.md 的 `### Fixed` 部分追加记录

**禁止行为**：

- 修复后不运行验证命令直接提交
- 验证未通过就提交
- 修复代码时顺带重构不相关的代码
- 不提交 Git commit
- 不更新 CHANGELOG.md

## Code Quality Fix Closed-Loop (代码质量修复闭环 - 硬性要求)

**Lint 错误修复、测试修复等代码质量工作必须完成以下闭环流程**：

1. **扫描 (Scan)**: 运行 lint/test 命令获取完整错误列表
2. **分类 (Classify)**: 按错误类型和文件分组，确定修复策略
3. **修复 (Fix)**: 逐文件修复，可使用子代理并行处理
4. **验证 (Verify)**: 与 Bug 修复闭环相同的验证标准
5. **提交 (Commit)**: Git commit 提交，commit message 以 `fix:` 或 `refactor:` 开头
6. **更新日志 (Changelog)**: 在项目的 CHANGELOG.md 的 `### Changed` 或 `### Fixed` 部分追加记录

## Git Commit Conventions

遵循 Conventional Commits 规范：

### Commit Message 格式

```
<type>: <subject>

[optional body]
```

### Type 类型

| Type | 说明 | CHANGELOG 分类 |
|---|---|---|
| `feat` | 新功能 | Added |
| `fix` | Bug 修复 | Fixed |
| `refactor` | 重构（不改变功能） | Changed |
| `perf` | 性能优化 | Changed |
| `style` | 代码格式调整 | - |
| `test` | 测试相关 | - |
| `docs` | 文档更新 | - |
| `chore` | 构建/工具配置 | - |

### Subject 规则

- 使用中文描述（除非项目约定使用英文）
- 简洁明了，不超过 50 字符
- 不以句号结尾
- 使用祈使句（"添加"而非"添加了"）

### 示例

```bash
feat: 添加单接口重新解析功能
fix: 修复解析完成后 Mock 数据未更新的问题
refactor: 重构 AI 解析管道为多步 Chain 架构
```

## CHANGELOG.md Maintenance

每次 `feat:` 或 `fix:` 类型的 commit 后，必须在对应项目的 CHANGELOG.md 中追加记录。

### 格式规范

遵循 [Keep a Changelog](https://keepachangelog.com/) 规范：

```markdown
## [Unreleased]

### Added
- 新功能描述（YYYY-MM-DD）

### Fixed
- Bug 修复描述（YYYY-MM-DD）

### Changed
- 重构/优化描述（YYYY-MM-DD）

### Removed
- 移除功能描述（YYYY-MM-DD）
```

### 维护规则

- `feat:` commit → 在 `### Added` 下追加
- `fix:` commit → 在 `### Fixed` 下追加
- `refactor:` / `perf:` commit → 在 `### Changed` 下追加
- 每行末尾标注日期（YYYY-MM-DD）
- 禁止删除或修改历史记录
- 正式发版时将 `[Unreleased]` 改为版本号和日期

## Code Conventions

### 通用规范

- 注释和日志输出使用中文
- 包管理器：pnpm
- 箭头函数优先：独立函数和导出函数使用箭头函数
- 代码修改后必须更新对应项目的 AGENTS.md（如涉及架构变更）

### 项目特定规范

各子项目的编码规范（lint 工具、TypeScript 配置、框架约定等）定义在各自的 AGENTS.md 中，开发前必须先阅读。

## MCP Tools

根据任务类型使用相应的 MCP 工具。可用的 MCP 工具在会话中动态提供，使用前参考 Skill & MCP Scan Protocol 进行扫描匹配。
