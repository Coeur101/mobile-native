# Design: 全项目三阶段工作流编排

## 1. 总体思路

工作流分为三个大阶段：

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

- change 负责表达“这次要做什么、为什么做、现在走到哪一阶段”
- task 负责表达“这一步怎么做完、怎么验证、证据在哪里”
- review 被拆成两个节点，分别约束开发前和开发后

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

- `intake`：刚接收到需求，还未形成足够上下文
- `research`：已开始代码、约束、风险调查
- `design`：正在形成或比较方案
- `design_review`：方案已形成，等待评审确认
- `planned`：task 已拆解，可进入开发
- `implementation`：task 正在执行
- `implementation_review`：实现完成，等待偏差审查
- `verified`：功能测试、UI 测试、build 验证完成
- `committed`：文档同步和 commit 已完成
- `archived`：change 生命周期结束
- `blocked`：任一阶段存在阻塞，无法推进

## 3. 三阶段职责

### Phase 1: Definition

目标：让 change 从“一个想法”变成“一个可执行对象”。

必需产物：

- `proposal.md`
- `design.md`
- `tasks.md`
- `TASK.json` 中对应 task 条目

必需检查：

- 需求来源清楚
- 代码现状和未知项已调研
- 方案边界、风险与非目标已说明
- 设计评审通过
- task 已拆分到可执行粒度

未完成 Phase 1，不得进入开发。

### Phase 2: Delivery

目标：按 task 执行设计，并以验证和评审证明实现正确。

必需动作：

- task 实现
- 功能测试
- user-facing task 的 Playwright 自动化 UI 测试
- build 或 compile 验证
- 实现评审

task 继续沿用细粒度闭环：

- `todo`
- `in_progress`
- `functional_verified`
- `ui_verified`
- `build_verified`
- `docs_verified`
- `committed`
- `done`
- `blocked`

### Phase 3: Closure

目标：把“已完成”变成正式交付状态。

必需动作：

- 文档同步
- changelog 更新
- commit
- change archive

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

实现评审发生在开发后、最终验证前。

评审内容：

- 实现是否符合 design
- 是否有未报告偏差
- 是否存在明显回归风险
- task history 是否完整

实现评审不通过，change 回到 `implementation`。

## 5. Task 执行账本

`TASK.json` 保存 task 当前真相，推荐关键字段：

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
- `pushRequired`
- `artifacts`
- `blockers`
- `historyRef`

说明：

- `phase` 表示 task 当前所处大阶段
- review 仍然属于 change 级节点，但 task 需要显式声明是否受其约束

## 6. 追加式 Task History

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

这份历史是审计依据，不回写旧记录。

## 7. 自动化 UI 测试规则

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
4. 删除临时测试脚本、报告、截图、trace、视频和输出目录

## 8. 临时测试产物生命周期

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

## 9. Archive 条件

change 允许 archive 的前提：

1. change 已进入 `committed`
2. 所有关联 task 都是 `done`
3. `design_review` 与 `implementation_review` 都已完成
4. 所有 required gate 都有结构化结果
5. 临时测试产物已清理
6. 无未处理 blocker

## 10. 工件映射

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
