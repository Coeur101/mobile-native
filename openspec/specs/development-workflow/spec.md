# development-workflow Specification

## ADDED Requirements

### Requirement: 全项目三阶段工作流

项目必须通过三个阶段治理交付：

- Definition
- Delivery
- Closure

每一个 change 都必须按顺序经过这三个阶段。

#### Scenario: change 进入 Delivery

- **Given** 一个 change 已完成需求接收、调研、方案设计、设计评审与任务拆解
- **And** `design_review` 已通过
- **When** 该 change 准备开始编码
- **Then** 它才可以进入 Delivery 阶段

#### Scenario: change 进入 Closure

- **Given** 一个 change 的实现评审已经完成
- **And** 所有必需验证已经通过
- **When** 该 change 准备收口
- **Then** 它才可以进入 Closure 阶段

### Requirement: Change 生命周期状态机

每一个 change 都必须显式使用以下生命周期状态：

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

#### Scenario: 设计未完成时不得开始实现

- **Given** 一个 change 尚未完成 `design_review`
- **When** 请求开始实现
- **Then** 该 change 不得进入 `implementation`

### Requirement: 开发前必须完成设计评审

项目必须在实现前完成设计评审。

设计评审必须至少检查：

- 需求是否清晰
- 方案范围与边界是否完整
- 风险与非目标是否明确
- 任务拆解是否达到可执行粒度

#### Scenario: 设计评审未通过

- **Given** 设计评审发现范围缺失或关键风险未解决
- **When** 记录评审结果
- **Then** 该 change 必须回退到 `research` 或 `design`

### Requirement: 收口前必须完成实现评审

项目必须在编码完成后、最终收口前完成实现评审。

实现评审必须至少检查：

- 实现是否与批准的设计一致
- 是否存在未报告偏差
- 是否存在明显回归风险
- task 历史与证据是否完整
- task 级 commit 记录是否完整且可追溯

#### Scenario: 实现评审未通过

- **Given** 实现评审发现缺陷、设计漂移或 commit 证据缺失
- **When** 记录评审结果
- **Then** 该 change 必须回退到 `implementation`

### Requirement: Task 级闭环交付

项目必须把每一个交付 task 视为独立闭环单元。

每一个 task 都必须：

- 先登记到 `TASK.json`
- 关联所属 OpenSpec change
- 显式声明需要通过哪些质量门禁
- 在所有必需门禁完成前保持未关闭状态

#### Scenario: 用户可见功能 task

- **Given** 一个 task 会改变用户可见行为或交互
- **When** 创建该 task
- **Then** 它必须将 `uiTestsRequired` 设为 `true`
- **And** 在自动化 UI 验证记录完成前不得进入 `done`

#### Scenario: 治理类 task

- **Given** 一个 task 只修改工作流文档或仓库治理规则
- **When** 创建该 task
- **Then** 功能测试、UI 测试与构建检查可以标记为不需要
- **And** 它仍然必须在进入 `done` 前记录文档证据

### Requirement: Task 级独立提交闭环

每一个交付型 task 都必须在进入 `done` 之前完成独立 commit。

该 commit 必须满足：

- 一个 task 对应一个独立 commit
- commit message 必须包含 task 标识符
- `TASK.json` 必须记录 `commitRequired`、`commitRef` 与 `commitMessage`
- task 历史必须记录 commit 事件与对应证据
- task 不得从 `docs_verified` 直接跳到 `done`

#### Scenario: 已验证但未提交的 task 不能关闭

- **Given** 一个交付型 task 已完成功能测试、UI 测试、构建验证和文档同步
- **And** 它当前处于 `docs_verified`
- **But** `commitRef` 仍为空
- **When** 尝试将 task 标记为 `done`
- **Then** 工作流必须拒绝该状态变更
- **And** 要求该 task 先进入 `committed`

#### Scenario: 已记录 commit 的 task 可以关闭

- **Given** 一个交付型 task 已完成所有必需门禁
- **And** `TASK.json` 已记录 `commitRef` 与 `commitMessage`
- **And** task 历史中存在对应的 commit 事件
- **When** 该 task 从 `committed` 进入 `done`
- **Then** 工作流可以接受该状态变更

#### Scenario: 实现评审必须检查 task 级 commit 可追溯性

- **Given** 一个 change 正在执行 `implementation_review`
- **When** 评审者检查 task 执行证据
- **Then** 必须逐个确认 task 的 commit 是否存在
- **And** 必须确认 commit message 与 `TASK.json` 记录可相互追溯

### Requirement: 追加式 Task 历史

项目必须为每一个 task 维护追加式执行历史，路径为：

`openspec/changes/<change>/logs/<task-id>.jsonl`

每一条历史事件都必须记录：

- task 标识
- 时间戳
- 执行者
- 步骤名
- 状态流转
- 执行结果
- 证据类型
- 证据引用
- 阻塞项

#### Scenario: task 步骤完成

- **Given** 一个 task 通过了某个工作流步骤
- **When** agent 推进该 task
- **Then** 必须先追加一条新的历史事件
- **And** 之后才可以宣称该步骤完成

### Requirement: 用户可见工作必须进行自动化 UI 验证

项目必须要求用户可见 task 通过基于 Playwright 的自动化 UI 验证。

用户可见工作包括：

- 视觉布局变更
- 交互流程变更
- 关键状态或错误态变更
- 导航或主操作变更

#### Scenario: 必须执行 UI 自动化

- **Given** 一个 task 会影响界面渲染或主要交互
- **When** 进入验证阶段
- **Then** agent 必须为该 task 生成并执行 Playwright 测试
- **And** 测试结果摘要必须写入 task 历史

### Requirement: 生成测试产物默认一次性

生成的测试文件及其运行产物默认都必须视为一次性临时产物。

临时产物包括：

- 临时生成功能测试文件
- 临时生成 Playwright 测试文件
- Playwright 报告
- 截图
- traces
- 视频
- 临时输出目录

agent 必须先记录结果，再删除这些临时产物。

#### Scenario: 一次性测试执行完成

- **Given** agent 为某个 task 生成了临时测试
- **When** 测试执行结束
- **Then** agent 必须先把执行摘要写入 task 历史
- **And** 删除生成的测试文件与运行产物
- **And** 如果清理未完成，则不得将该 task 标记为 `done`

### Requirement: Change 归档门禁

一个 OpenSpec change 在其 task 全部完成且双 review 全部结束前不得归档。

#### Scenario: change 仍存在未完成工作

- **Given** 一个 change 至少存在一个 task 不处于 `done`
- **Or** 缺少 `design_review`
- **Or** 缺少 `implementation_review`
- **When** 请求归档
- **Then** 工作流必须拒绝归档

#### Scenario: change 满足归档条件

- **Given** 一个 change 下所有 task 都处于 `done`
- **And** 不存在 blocker
- **And** 所有必需证据都已记录
- **And** 所有一次性测试产物都已清理
- **And** 双 review 都已完成
- **When** 请求归档
- **Then** 该 change 才可以归档
