# Agent Harness Init

Generated: 2026-03-27T05:51:59.866Z
Project: AI Web Builder Mobile
Branch: master
Commit: cf1db5d

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

- Active change missing TASK.json mapping: integrate-free-email-and-wechat-auth (openspec/changes/integrate-free-email-and-wechat-auth)
- Project data still depends on a mock service (src/services/project/mock-project-service.ts)
- AI generation still depends on a mock service (src/services/ai/mock-ai-service.ts)
- Settings page still depends on local mock settings (src/pages/settings/SettingsPage.tsx)
