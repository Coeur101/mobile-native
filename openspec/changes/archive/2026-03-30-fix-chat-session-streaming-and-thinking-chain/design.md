## Context

当前编辑器会话页由 `src/pages/editor/EditorPage.tsx` 直接消费 `project.messages` 渲染消息列表，只在 `projectService.createProject` / `continueProject` 返回完整项目后一次性追加 assistant 消息。`src/services/ai/openai-compatible-ai-service.ts` 目前也只支持请求完成后解析整包 JSON，再生成最终 `assistantMessage` 与 `thinkingSteps`，没有任何流式中间态接口。因此会话窗口无法在生成期间逐步显示内容，也无法在进行中呈现思维链状态。

现有 `ThoughtChain` 组件已经具备步骤状态渲染能力，但只会在消息最终落库后读取 `thinkingSteps` 展示。与此同时，`project-data` 规格把项目消息视为权威项目模型的一部分，要求消息记录在正式持久化时具有可恢复性。这意味着本次设计不能把流式中间片段直接写入正式项目记录，而必须区分“会话临时态”和“完成落库态”。

这次 change 还受到项目治理约束：工作流必须遵循 Definition / Delivery / Closure 三阶段；实现前需要完成 design review，收口前需要完成 implementation review；每个 delivery task 必须先登记到 `TASK.json`，再维护追加式 `openspec/changes/<change>/logs/<task-id>.jsonl` 历史，并在 done 前完成独立 commit。由于本次改动横跨 AI 服务、前端会话渲染、消息模型和自动化验证，必须在设计里明确这些约束如何映射到实际交付。

## Goals / Non-Goals

**Goals:**
- 为编辑器会话窗口提供流式 assistant 输出，让用户在生成过程中持续看到最新文本。
- 为编辑器会话窗口提供进行中的思维链展示，并在生成结束后把可保留步骤并入最终 assistant 消息。
- 明确临时流式状态、最终项目消息、项目持久化三者的边界，避免中间态污染权威记录。
- 为后续 Delivery 阶段定义清晰的 task 切分原则、review 门禁、状态机与提交追溯规则。
- 保持 `TASK.json`、task 日志和 git commit 引用一致，确保回归时可以追踪每次变更责任面。

**Non-Goals:**
- 不重写 AI provider 协议，也不引入新的 SDK 或新的远端消息存储后端。
- 不扩展为多路并发生成、断点续传、多模型对比或全新的会话信息架构。
- 不对编辑器页面做整页视觉重设计，只修复与会话窗口生成反馈相关的交互与状态展示。
- 不保留截图、trace、录屏、临时测试文件等一次性验证产物，验证结果记录后即删除。

## Decisions

### 1. 在 AI 服务边界新增“流式会话结果”接口，而不是在页面层手工拆字符串

决定在 `openai-compatible-ai-service` 内新增流式生成接口或等效能力，由服务层负责处理 `fetch` 流、chunk 累积、JSON 片段解析和最终结果收敛，页面层只消费结构化事件。

选择原因：
- 当前 AI 服务已经承担请求构造、配置校验、响应解析和 `thinkingSteps` 归一化责任，流式协议解析继续放在服务层最一致。
- 若在页面层直接处理文本流，会把 provider 协议细节泄露给 UI，后续难以测试和替换。

备选方案：
- 备选 A：继续只保留整包返回，靠假 loading 或打字机动画模拟流式。
  否决原因：无法解决“真实进度不可见”和“思维链缺失”的问题。
- 备选 B：在 `projectService` 层处理网络流。
  否决原因：`projectService` 负责项目持久化，不适合作为 provider 协议解析层。

### 2. 引入会话级临时 assistant draft 状态，不把中间片段直接写入 `project.messages`

决定在编辑器页或其配套 store 中维护一个临时 draft assistant message，其中包含：
- `streamingContent`
- `thinkingSteps`
- `generationStatus`
- `startedAt`

生成完成后再把最终内容交给 `projectService` 持久化为正式消息。

选择原因：
- `project.messages` 当前是项目权威记录的一部分，直接写入中间片段会导致版本恢复、列表展示和持久化一致性变复杂。
- draft 状态只服务于当前会话窗口 UI，可在失败、取消或页面离开时安全丢弃。

备选方案：
- 备选 A：每个 chunk 都调用 `appendProjectMessage` 或持续更新项目消息。
  否决原因：会产生大量中间态写入，污染持久化模型，也增加失败恢复复杂度。

### 3. 思维链采用“事件驱动更新 + 完成态收敛”，而不是只在最终消息中补充

决定把思维链视为会话流的一部分：生成期间持续更新步骤状态，生成完成后仅保留符合约束的最终 `thinkingSteps` 写入正式 assistant message。

选择原因：
- `ThoughtChain` 组件已经支持 `pending/loading/success/error` 状态，这次只需让数据源从“完成后一次性提供”升级为“生成中持续刷新”。
- 这样既能满足用户观察过程的需求，又能维持最终消息的数据结构稳定。

备选方案：
- 备选 A：保留现有最终态展示，不在生成中显示步骤。
  否决原因：不能解决用户提出的“没有显示思维链”问题。

### 4. 通过显式生成状态机管理会话生命周期

决定把生成流程定义为明确状态机：
- `idle`
- `streaming`
- `persisting`
- `completed`
- `failed`

页面按钮、输入框、滚动行为、错误提示都围绕这个状态机工作。

选择原因：
- 目前 `EditorPage` 只有布尔型 `isGenerating`，不足以区分“正在流式输出”和“正在最终落库”。
- 显式状态机可以减少 UI 闪烁和重复提交问题，也便于在 Playwright 中稳定断言。

### 5. `TASK.json` 与 change 日志保持同一 task 粒度，commit 必须双向可追溯

决定在 Delivery 阶段把实现拆成若干 task，例如“流式 AI 服务”“编辑器 draft 状态”“思维链渲染与回收”“Playwright 验证”等。每个 task 必须：
- 先写入 `TASK.json`，声明 `commitRequired`、质量门禁和验证命令。
- 在执行期间持续追加到 `openspec/changes/fix-chat-session-streaming-and-thinking-chain/logs/<task-id>.jsonl`。
- 完成后记录独立 commit hash 与 commit message。

一致性规则：
- `TASK.json` 是任务注册表和当前状态源。
- `logs/<task-id>.jsonl` 是该 task 的时间序列历史。
- 二者必须共享同一个 `task-id`、状态推进和 `commitRef`，避免出现任务已 done 但日志缺失，或日志存在但 `TASK.json` 未登记的分裂状态。

### 6. Definition / Delivery / Closure 三阶段和双 review 作为实现门禁写入设计

决定在 design 中显式约束：
- Definition：完成 proposal、specs、design，并通过 design review 后才能开始代码改动。
- Delivery：每个 task 独立实现、验证、提交，并更新 `TASK.json` 与日志。
- Closure：implementation review、验证证据整理、一次性产物清理、归档前检查 blocker。

选择原因：
- 这次修复跨层级，若不把双 review 和阶段门禁显式写入 design，后续很容易直接跳到编码而忽略规格与落库边界。

## Risks / Trade-offs

- [Risk] 流式协议与当前 provider 返回格式不兼容，导致无法稳定解析思维链事件  
  → Mitigation：先在 AI 服务层定义降级策略；若 provider 不支持真实流式，则至少保持文本 chunk 流与最终结果收敛兼容。

- [Risk] draft 状态与最终落库状态切换时出现重复消息或顺序错乱  
  → Mitigation：使用单一 assistant draft 容器，只有在 `persisting -> completed` 成功后才替换为正式消息。

- [Risk] 思维链在生成中更新过于频繁，导致列表渲染抖动  
  → Mitigation：对步骤更新做批次合并或节流，只在可见增量出现时刷新 UI。

- [Risk] Playwright 用例容易因流式异步时序变脆  
  → Mitigation：优先断言可观察状态变化，例如 draft 气泡出现、步骤状态变化、最终消息落地，而不是依赖固定时间等待。

- [Risk] task 切分不当会让 `TASK.json` 和日志记录过粗，失去 commit 追溯意义  
  → Mitigation：按代码责任面拆 task，保证每个 task 都有明确写集、验证命令和单独 commit。

## Migration Plan

- Definition 阶段完成后，先补 specs，锁定 `assistant-chat-session` 与 `project-data` 的 requirement。
- Delivery 阶段优先实现 AI 服务流式解析与编辑器 draft 状态，再接入思维链展示与最终持久化。
- 之后补充 Vitest / Playwright 验证，记录结果到任务历史，并删除截图、trace、录屏等一次性产物。
- 如上线后发现 provider 流式兼容问题，可回退到上一个独立 task commit，同时保留非流式正式消息链路不变。

## Open Questions

- 当前兼容的 OpenAI-compatible provider 是否稳定支持可用于思维链展示的流式事件格式，还是需要先定义本地降级协议？
- 思维链最终落库时是否需要过滤过长 `content`，以避免项目消息记录体积膨胀？
- 是否需要为“用户中途离开页面”定义 draft 丢弃与恢复策略，还是仅要求当前会话内可见即可？
