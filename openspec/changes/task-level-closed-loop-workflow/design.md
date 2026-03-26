# Design: 全项目三阶段与 task 级独立提交闭环工作流

## 1. 总体思路

工作流按项目视角拆成三个阶段：

```text
Phase 1: Definition
  intake
  -> research
  -> design
  -> design_review
  -> planned

Phase 2: Delivery
  implementation
  -> task execution
  -> implementation_review
  -> verified

Phase 3: Closure
  docs_sync
  -> committed
  -> archived
```

其中：

- change 负责表达“这次要做什么、为什么做、当前处于哪个阶段”
- task 负责表达“这一项如何做完、如何验证、对应证据在哪里”
- review 拆成两个节点，分别约束开发前与开发后
- commit 不再只是 change 末尾动作，而是 task 关闭前的强制门禁

## 2. Change 生命周期

推荐 change 状态如下：

- `intake`
- `research`
- `design`
- `design_review`
- `planned`
- `implementation`
- `implementation_review`
- `verified`
- `committed`
- `archived`
- `blocked`

状态含义：

- `intake`：刚接收到需求，尚未建立足够上下文
- `research`：正在调查代码、约束、风险与依赖
- `design`：正在形成方案与边界
- `design_review`：设计已形成，等待评审确认
- `planned`：任务已拆解，可进入开发
- `implementation`：正在执行 delivery tasks
- `implementation_review`：实现完成，等待偏差审查
- `verified`：必需的功能测试、UI 测试与构建验证均已完成
- `committed`：change 所有关联 task 已具备独立 commit 证据，change 级收口提交已完成
- `archived`：change 生命周期结束
- `blocked`：任一阶段存在阻塞，无法继续推进

## 3. 三阶段职责

### Phase 1: Definition

目标：把“一个想法”变成“一个可执行 change”。

必需产物：

- `proposal.md`
- `design.md`
- `tasks.md`
- `TASK.json` 中对应 task 条目

必需检查：

- 需求来源清楚
- 代码现状与未知项已调研
- 方案边界、风险与非目标已说明
- 设计评审通过
- task 已拆分到可执行粒度

未完成 Phase 1，不得进入开发。

### Phase 2: Delivery

目标：按 task 执行设计，并用评审与验证证明实现正确。

必需动作：

- task 实现
- 功能测试
- user-facing task 的 Playwright 自动化 UI 测试
- build 或 compile 验证
- 实现评审

task 继续沿用细粒度状态机，但必须显式经过：

- `todo`
- `in_progress`
- `functional_verified`
- `ui_verified`
- `build_verified`
- `docs_verified`
- `committed`
- `done`
- `blocked`

核心约束：

- `docs_verified -> done` 直接跳转被禁止
- 所有交付型 task 都必须经过 `committed`
- `committed` 必须有 commit hash 与 commit message 证据

### Phase 3: Closure

目标：把“已完成”变成正式交付状态。

必需动作：

- 文档同步
- changelog 更新
- change 级提交
- archive

## 4. 双 Review 模型

### design_review

设计评审发生在开发前。

评审内容：

- 需求理解是否准确
- 方案是否覆盖关键场景
- 风险与非目标是否明确
- task 拆解是否足够支撑执行

设计评审不通过，change 回到 `research` 或 `design`。

### implementation_review

实现评审发生在开发后、最终收口前。

评审内容：

- 实现是否符合 design
- 是否存在未报告偏差
- 是否存在明显回归风险
- task history 是否完整
- 每个交付型 task 是否具备独立 commit 证据
- commit message 是否包含 task 标识并与台账一致

实现评审不通过，change 回到 `implementation`。

## 5. Task 级独立提交闭环

交付型 task 必须坚持“一项功能点，一个 commit”。

设计原则：

1. task 只有在代码、验证、文档和提交证据都完整后才能关闭。
2. commit 不是附属动作，而是 task `done` 的前置状态。
3. commit message 必须带 task 标识，便于从提交历史反查 task。
4. `TASK.json` 与 `logs/<task-id>.jsonl` 必须同时记录提交证据。
5. 实现评审必须检查 commit 粒度是否与 task 粒度匹配。

推荐提交格式：

```text
feat: TASK-010 完成邮箱验证码登录
fix: TASK-011 修复登录态 7 天过期恢复
docs: TASK-007 收紧 task 级独立提交闭环规则
```

task 状态流转如下：

```text
todo
  -> in_progress
  -> functional_verified
  -> ui_verified      (仅 user-facing task 必需)
  -> build_verified   (仅需要构建验证的 task 必需)
  -> docs_verified
  -> committed
  -> done
```

门禁规则：

- `commitRequired = true` 的 task，未进入 `committed` 前不得进入 `done`
- `commitRef` 为空时，不得把 task 状态更新为 `done`
- `artifacts.commits` 必须至少记录一个与 task 对应的 commit 证据
- 历史日志中必须存在 `task_committed` 事件

## 6. Task 执行台账

`TASK.json` 保存 task 当前真相，推荐关键字段如下：

- `id`
- `change`
- `phase`
- `title`
- `type`
- `status`
- `priority`
- `scope`
- `acceptanceCriteria`
- `functionalTestsRequired`
- `uiTestsRequired`
- `buildRequired`
- `designReviewRequired`
- `implementationReviewRequired`
- `docsToUpdate`
- `commitRequired`
- `commitRef`
- `commitMessage`
- `pushRequired`
- `artifacts`
- `blockers`
- `historyRef`

说明：

- `phase` 表示 task 当前所属大阶段
- `commitRequired` 表示该 task 是否必须独立提交
- `commitRef` 记录 commit hash 或短 hash
- `commitMessage` 记录用于回溯的提交信息
- review 仍属于 change 级节点，但 task 需要声明自身是否受 review 约束

## 7. 追加式 Task History

每个 task 的执行历史写入：

`openspec/changes/<change>/logs/<task-id>.jsonl`

每条事件至少包含：

- `eventId`
- `taskId`
- `timestamp`
- `actor`
- `step`
- `fromStatus`
- `toStatus`
- `summary`
- `evidenceType`
- `evidenceRef`
- `result`
- `blockers`

对提交闭环的新增要求：

- 必须追加 `task_committed` 或等价事件
- `summary` 中明确说明提交覆盖的功能点
- `evidenceRef` 必须包含 commit hash 或台账引用

这份历史是审计依据，不回写旧记录。

## 8. 自动化 UI 测试规则

user-facing task 必须执行 Playwright 自动化 UI 测试。

判定范围：

- 用户可见行为变化
- 关键交互流变化
- 视觉结构或布局变化
- 状态反馈、空态、错误态变化
- 导航、主 CTA 或关键按钮变化

通过要求：

1. 为当前 task 生成 UI 测试
2. 执行测试
3. 将结果摘要写入 task history
4. 删除临时测试脚本、报告、截图、trace、视频与输出目录

## 9. 临时测试产物生命周期

默认策略：

```text
generate test
  -> run test
  -> summarize result
  -> append history
  -> delete artifacts
  -> continue workflow
```

临时产物包括：

- 临时功能测试文件
- 临时 Playwright 测试文件
- `playwright-report/`
- `test-results/`
- `.tmp/task-runs/<task-id>/`
- 临时截图、trace、视频

默认不保留这些产物，除非显式标记为 persistent test。

## 10. 归档条件

change 允许 archive 的前提：

1. change 已进入 `committed`
2. 所有关联 task 都是 `done`
3. `design_review` 与 `implementation_review` 都已完成
4. 所有 required gate 都有结构化结果
5. 临时测试产物已清理
6. 所有 `commitRequired = true` 的 task 都已记录 `commitRef` 和 `commitMessage`
7. 无未处理 blocker

## 11. 工件映射

```text
Project layer
  docs/PRD.md
  PROJECT.md

Change layer
  proposal.md
  design.md
  tasks.md

Task layer
  TASK.json
  logs/<task-id>.jsonl

Release layer
  CHANGELOG.md
  commit history
```
