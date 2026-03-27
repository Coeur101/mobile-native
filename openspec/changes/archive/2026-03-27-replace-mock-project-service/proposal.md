## Why

当前项目数据仍完全依赖 `mockProjectService + localDb`，虽然认证和用户资料已经切到 Supabase-backed 模型，但项目列表、版本快照、对话消息仍停留在本地 mock 语义，导致“已登录用户拥有真实项目数据”这条主线还没有闭环。现在继续堆叠编辑、分享或 AI 能力，会把错误的数据边界继续放大，所以需要先把项目持久化边界收回到真实的用户级数据模型上。

## What Changes

- 以真实持久化边界替换 `mockProjectService`，让项目、版本、消息围绕当前认证用户落到正式数据源，而不是只写本地快照。
- 收敛 `localDb` 对项目数据的职责，只保留缓存、启动恢复或迁移辅助用途，不再把本地数据当作项目真值源。
- 统一首页、编辑页、预览页对项目服务的调用路径，覆盖创建、继续生成、保存版本、恢复版本、更新元数据、删除项目等核心操作。
- 为当前本地项目数据提供受控迁移/回填策略，避免已登录用户在切换到真实持久化边界后直接丢失已有项目记录。
- 补充与项目持久化相关的功能验证、UI 验证和文档同步，并继续遵守一次性测试产物记录后清理的治理规则。
- Non-goals:
  - 本 change 不替换 `mockAIService`，AI 生成链路仍单独作为后续 backlog 处理。
  - 本 change 不一次性交付多设备实时同步、冲突解决、分享链接或团队协作。
  - 本 change 不要求在同一阶段解决所有 Supabase 表运维问题，但会把前端所需的数据契约、错误态和依赖写清。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `project-data`: 将项目、版本、消息和用户级项目缓存从本地 mock 语义升级为真实的认证用户持久化边界。

## Impact

- Affected code:
  - `src/services/project/*`
  - `src/lib/local-db.ts`
  - `src/pages/home/HomePage.tsx`
  - `src/pages/editor/EditorPage.tsx`
  - `src/pages/preview/PreviewPage.tsx`
  - `src/types/index.ts`
- External systems:
  - Supabase database / data access boundary
  - authenticated user identity from the current auth flow
- Docs and governance:
  - `openspec/specs/project-data/spec.md`
  - `docs/PRD.md`
  - `PROJECT.md`
  - `TASK.json`
