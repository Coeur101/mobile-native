# CLAUDE.md

## 项目信息

- 项目：AI Web Builder Mobile
- 类型：AI 原生移动端网页生成器
- 主要语言：zh-CN

## 关联文档

- `docs/PRD.md`：产品需求、范围与里程碑
- `PROJECT.md`：项目结构、技术栈、命令与交付规则
- `CHANGELOG.md`：仅记录已完成且已验证的变更
- `TASK.json`：任务执行台账，所有功能、修复、治理改动都必须先登记
- `openspec/specs/development-workflow/spec.md`：全项目三阶段工作流规范

## 能力审计顺序

1. 先检查本地已安装的 skills。
2. 再检查可用 MCP 资源与模板。
3. 本地能力不足时，再使用 `find-skills` 搜索补充技能。
4. 需要安装外部技能或下载外部资源时，必须先征得用户同意。

## 三阶段主工作流

### Phase 1: Definition

按顺序完成：

1. 需求接收 `intake`
2. 调研 `research`
3. 方案设计 `design`
4. 设计评审 `design_review`
5. 任务规划 `planned`

Definition 阶段必须产出或更新：

- `proposal.md`
- `design.md`
- `tasks.md`
- `TASK.json`

未完成设计评审，不得进入开发。

### Phase 2: Delivery

按顺序完成：

1. 开发实现 `implementation`
2. task 执行与历史记录
3. 实现评审 `implementation_review`
4. 功能测试、UI 测试、build 验证
5. 文档同步
6. task 独立 commit
7. change 进入 `verified`

user-facing task 必须执行 Playwright 自动化 UI 测试。

### Phase 3: Closure

按顺序完成：

1. 汇总交付结果
2. changelog 更新
3. change 级收口检查
4. archive

未完成 Closure，不得宣称 change 已结束。

## 双 Review 规则

### design_review

- 发生在开发前
- 检查需求理解、边界、风险、非目标、task 拆解是否足够
- 未通过时回退到 `research` 或 `design`

### implementation_review

- 发生在开发后
- 检查实现是否符合 design、是否有未报告偏差、是否有回归风险、task history 是否完整
- 必须逐项检查 task 级 commit 是否存在、是否可追溯、是否与 task 粒度一致
- 未通过时回退到 `implementation`

## Task 级闭环规则

1. 所有开发工作必须先在 `TASK.json` 中登记 task，并关联对应 OpenSpec change。
2. 每个 task 都是独立闭环单元，不能只完成代码实现。
3. 每个 task 都必须维护追加式历史日志，写入 `openspec/changes/<change>/logs/<task-id>.jsonl`。
4. 每个 task 按需完成这些门禁：
   - 功能实现
   - 功能测试验证
   - user-facing 变更的 Playwright 自动化 UI 测试
   - 构建或编译验证
   - 文档同步
   - commit
   - push
5. 每个交付型 task 都必须独立 commit，一项功能点对应一个 commit。
6. commit message 必须包含 task 标识，`TASK.json` 必须记录 `commitRef` 与 `commitMessage`。
7. 只有当 task 的必需门禁全部通过、提交证据完整且无 blocker 时，task 才能进入 `done`。
8. 只有当一个 change 下所有 task 都是 `done`，且双 review 完成时，该 change 才允许 archive。

## 测试与临时产物规则

- 功能测试与 UI 测试可以为当前 task 临时生成测试文件。
- 所有临时生成的测试文件、Playwright 报告、截图、trace、视频、临时输出目录，在结果写入 task history 后必须删除。
- 不允许保留无明确长期价值的临时测试文件，避免污染仓库和增加后续上下文读取负担。
- 如需长期保留，必须在 task 中显式声明为 persistent test。
- 未先记录结果就删除临时测试产物，视为流程违规。
- 已记录结果但未清理临时测试产物，task 不得进入 `done`。

## 提交与推送规则

- 使用中文 Conventional Commits：`feat:`、`fix:`、`refactor:`、`docs:`、`test:`、`chore:`
- 禁止把多个无关 task 合并为一次提交
- 每个交付型 task 完成后必须立即提交，不得把多个功能点拖到 change 末尾再统一 commit
- 没有 remote 或 upstream 时必须明确记录为 blocker，不得伪造 push 成功
- 未通过必需门禁前，不得提交会宣称“已完成”的 changelog 记录
- 禁止 `git push --force` 到主分支

## 文档同步规则

- 项目结构、命令、工作流变化时同步维护 `PROJECT.md`
- 产品范围或需求变化时同步维护 `docs/PRD.md`
- 只有完成并验证通过的变更才能写入 `CHANGELOG.md`
- OpenSpec 的 proposal、design、tasks、spec 与 `TASK.json` 必须保持一致

## 代码与输出约定

- 注释、日志、任务说明优先使用中文
- 包管理器使用 `pnpm`
- 默认优先小范围改动，不扩大无关变更
