# Agent Harness Init

Generated: 2026-03-27T05:28:37.621Z
Project: AI Web Builder Mobile
Branch: master
Commit: 5077d95

## Harness Mapping

- Initializer harness: OpenSpec proposal/design/tasks + `TASK.json`
- Feature list: `.agent-harness/feature-list.json`
- Progress bridge: task logs + `.agent-harness/progress.jsonl`
- E2E verification: Playwright / Vitest / build commands recorded per task

## Session Startup Order

1. Run `pnpm agent:refresh`
2. Read `.agent-harness/session-brief.md`
3. Read the current focus task's `mustRead` files
4. Implement one atomic task
5. Run the recorded verification commands
6. Append a session checkpoint with `pnpm agent:log -- done <TASK-ID> "..."`

## Current Focus

- TASK-019: 新增个人信息页并替换首页右上角入口
- Change: otp-auth-and-supabase-user-profile
- Required checks: pnpm build

## Repo Backlog Signals

- 活跃 change 缺少 TASK.json 任务映射：integrate-free-email-and-wechat-auth (openspec/changes/integrate-free-email-and-wechat-auth)
- 项目数据仍以 mock service 为主 (src/services/project/mock-project-service.ts)
- AI 生成仍以 mock service 为主 (src/services/ai/mock-ai-service.ts)
- 设置页仍依赖本地 mock settings (src/pages/settings/SettingsPage.tsx)
