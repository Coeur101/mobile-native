## Context

当前认证、会话和用户资料已经切到 Supabase-backed 模型，但项目数据链路仍停留在 `mockProjectService + localDb`：

- `src/pages/home/HomePage.tsx`、`src/pages/editor/EditorPage.tsx`、`src/pages/preview/PreviewPage.tsx` 直接依赖 mock project service。
- `src/services/project/mock-project-service.ts` 把项目、版本、消息全部写入本地缓存，并继续耦合 `mockAIService`。
- `openspec/specs/project-data/spec.md` 已经定义了“项目属于当前认证用户、版本和消息附着到项目模型、local 不是 profile 真值源”，但项目部分还没有真实 backing store。

这意味着项目数据层和认证数据层的真值边界不一致：用户身份已经是真实的，项目数据却仍然是假持久化。这会阻塞后续分享、云端同步、真实 AI 生成记录和跨设备恢复。

## Goals / Non-Goals

**Goals:**

- 为项目、项目版本、项目消息建立真实的认证用户持久化边界。
- 让首页、编辑页、预览页通过统一 `ProjectService` 接口访问真实项目数据。
- 将 `localDb` 收敛为缓存和 legacy 迁移辅助层，不再充当项目真值源。
- 定义从现有本地项目数据到真实 backing store 的受控迁移策略。
- 为本次 change 建立 TASK.json 台账、review 节点和验证策略。

**Non-Goals:**

- 不替换 `mockAIService` 的生成逻辑，只替换项目数据落盘和读取边界。
- 不交付实时协作、冲突合并、多端实时同步或分享链接。
- 不要求在本 change 中完成所有 Supabase 运维脚本，但需要把前端依赖的数据契约说清。

## Decisions

### Decision 1: 引入真实的 `ProjectService` 持久化实现，并保留接口层不变

选择：

- 新增真实项目服务实现，继续满足现有 `ProjectService` 接口。
- 页面和流程只依赖统一导出的服务入口，不再直接引用 `mockProjectService`。

原因：

- 这样可以最小化 UI 层改动范围，先替换数据边界，再决定是否拆分更细的 repository/store。
- 现有 `ProjectService` 已覆盖列表、详情、创建、续写、版本、消息、删除等核心动作，适合作为切换点。

备选方案：

- 继续让页面直接依赖 `mockProjectService` 并在内部偷偷同步远端：被拒绝，因为 mock 语义会继续污染调用方。
- 直接把所有逻辑塞到 Zustand store：被拒绝，因为会让网络 IO、缓存和 UI 状态再次耦合。

### Decision 2: 远端项目记录为真值源，`localDb` 仅保留缓存与迁移职责

选择：

- 认证用户的项目列表、详情、版本、消息以远端 backing store 为准。
- `localDb` 只保存最近一次同步快照和 legacy 本地项目，用于启动加速、离线兜底和一次性迁移。

原因：

- 当前问题的本质不是“缺少缓存”，而是“缓存被当成了真值源”。
- 一旦项目数据进入真实持久化边界，后续跨设备恢复、分享和计费能力才有稳定基础。

备选方案：

- 保持 local-first，再把远端当备份：被拒绝，因为仍无法保证 authenticated user 的项目边界一致。

### Decision 3: legacy 本地项目采用按用户受控迁移，而不是粗暴清空

选择：

- 为当前认证用户扫描本地 legacy 项目数据。
- 仅迁移归属于当前用户且尚未标记完成迁移的项目。
- 迁移成功后写入迁移标记，避免重复导入。

原因：

- 当前仓库已经在本地项目结构中保留了 `ownerUserId`，具备最小可用迁移条件。
- 直接清空会破坏已有测试和本地使用记录，不符合当前产品阶段。

备选方案：

- 不做迁移，直接让用户重新创建项目：被拒绝，因为会造成已登录用户数据断层。
- 启动时无条件全量覆盖远端：被拒绝，因为容易重复导入或污染非当前用户数据。

### Decision 4: 版本和消息仍保持显式子记录模型

选择：

- 项目记录保存当前文件快照与元数据。
- 项目版本和项目消息继续作为附着到项目的显式记录，而不是混入单个大 JSON blob。

原因：

- 现有类型和 spec 已经按项目 / 版本 / 消息三层结构定义。
- 继续保持子记录模型，后续更容易支持版本审计、对话分页和恢复逻辑。

备选方案：

- 把版本和消息全部塞回项目记录：被拒绝，因为会放大单条记录体积，也会削弱后续扩展性。

## Risks / Trade-offs

- [远端数据表尚未完全配置] → 先把前端契约、错误态和依赖写清；实现阶段允许通过环境检查和空态提示保护未配置环境。
- [legacy 本地项目迁移可能重复导入] → 为每个已迁移项目记录迁移标记，并只对当前认证用户执行迁移。
- [页面流程从同步本地调用切到异步远端调用后，UI 可能暴露空白或抖动] → 在首页、编辑页、预览页补齐 loading、empty 和 error 状态。
- [AI 生成仍是 mock，可能让“真实项目存储”与“mock 生成内容”并存] → 明确这是预期拆分，先修正项目数据落盘边界，再单独替换 AI 服务。
