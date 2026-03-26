# Proposal: 全项目三阶段与 task 级独立提交闭环工作流

## 背景

当前仓库已经建立了 task 级闭环的基础约束，但仍然存在两个明显缺口：

一是工作流虽然覆盖了 task 注册、验证、历史记录与最终收口，却没有把“需求接收、调研、设计、评审、开发、验证、提交、归档”串成一条完整主链路。

二是现有闭环没有把“每完成一个功能点就独立提交一次”设为强制规则，导致 task 可能已经通过测试与文档同步，却没有对应 commit，也无法通过 commit hash 回溯到具体功能点。

这会带来几个直接问题：

- change 进入开发前缺少统一的阶段门禁
- review 没有拆分为设计评审与实现评审两个明确节点
- task 虽然能记录测试和文档证据，但无法保证提交粒度与 task 粒度一致
- 归档更像“代码结束”，而不是“项目交付闭环结束”

## 目标

- 将项目工作流统一拆成 Definition、Delivery、Closure 三个阶段
- 将 review 拆分为 `design_review` 与 `implementation_review`
- 要求每个交付型 task 在进入 `done` 前必须完成独立 commit
- 要求 commit message 包含 task 标识，并在 `TASK.json` 与 task history 中可追溯
- 保留 user-facing task 的自动化 UI 测试要求
- 保留“测试执行完成后删除临时测试文件与测试产物”的清理要求
- 让 OpenSpec 工件、`TASK.json`、项目文档和 task 日志表达同一套治理规则

## 范围

- 更新本 workflow change 的 proposal、design、tasks
- 更新 `openspec/specs/development-workflow/spec.md`
- 更新 `openspec/config.yaml`
- 更新 `PROJECT.md`、`.claude/CLAUDE.md`、`CHANGELOG.md`
- 扩展 `TASK.json` 的 task 提交追踪字段
- 为本次治理变更补充新的 task 与历史日志

## 非目标

- 不引入新的业务功能
- 不实现新的业务测试脚本
- 不引入新的第三方依赖
- 不追溯伪造历史 task 的 commit 记录
