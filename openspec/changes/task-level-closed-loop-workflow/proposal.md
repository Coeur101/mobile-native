# Proposal: 全项目三阶段工作流编排

## 背景

当前仓库已经具备 task 级闭环的基础规则，但工作流仍主要覆盖开发后半段。需求接收、调研、方案设计、设计评审、任务规划这些前置环节，还没有被统一纳入同一套生命周期。

这会带来几个问题：

- change 在进入开发前缺少明确阶段门禁
- review 只有一个模糊概念，没有区分设计评审与实现评审
- task 虽然可以闭环，但 task 所依赖的设计输入不一定完整
- archive 更像“代码结束”而不是“项目交付闭环结束”

## 目标

- 把项目工作流拆成三阶段：Definition、Delivery、Closure
- 将 review 拆为 `design_review` 和 `implementation_review`
- 定义 change 生命周期，使需求接收、调研、设计、开发、测试、commit、archive 形成单一主链路
- 保留 task 级闭环、自动化 UI 测试、临时测试产物执行后删除的规则
- 让 OpenSpec 工件、`TASK.json`、项目文档和执行日志共同表达这套完整工作流

## 范围

- 更新现有 workflow change 的 proposal、design、tasks
- 扩展 `openspec/specs/development-workflow/spec.md`
- 升级项目级文档与执行账本
- 为本次工作流扩展新增 task 记录与 history

## 非目标

- 本 change 不引入新的业务功能
- 本 change 不实现具体 Playwright 用例或脚本
- 本 change 不引入新的外部依赖
