## Why

当前会话窗口在 AI 生成期间只能等待整段结果一次性落地，用户既看不到流式输出，也看不到思维链，导致生成过程缺少可观察性，出现卡顿或长响应时无法判断系统是否仍在工作。这个问题已经直接影响核心对话体验，而且属于高频 user-facing 路径，必须先在 Definition 阶段明确范围与验收边界，再进入 Delivery 和 Closure，避免在实现中继续混淆临时会话状态、持久化消息和 UI 展示责任。

另外，这类会话链路会同时触及 AI 服务、消息持久化、编辑器状态和前端交互，若不保持 task 级独立 commit，很难在回归时快速定位是哪一步引入了流式渲染、思维链展示或消息落库的不一致。因此本次 change 需要沿用三阶段工作流与 task 级提交门禁，并在验证后清理一次性测试产物。

## What Changes

- 为编辑器会话窗口增加 AI 回复的流式展示能力，让用户在生成过程中持续看到最新输出，而不是只在完成后一次性显示。
- 为会话窗口增加思维链展示能力，支持在生成中显示步骤状态，并在生成完成后把可保留的步骤信息关联到最终 assistant 消息。
- 调整会话生成链路中的临时状态与最终持久化边界，确保流式中的中间态不会污染正式项目消息记录，但完成态可以稳定回写。
- 明确本次修复的 scope 仅限会话窗口的生成可见性、思维链展示与相关状态同步，不包含模型切换、提示词策略重写、版本历史改造或整页视觉重设计。
- 明确 non-goals：不更换 AI provider 协议、不引入新的对话存储后端、不扩展为多轮并发生成、不保留截图、trace、视频等一次性验证产物；这些产物仅用于验证并在记录结果后删除。

## Capabilities

### New Capabilities
- `assistant-chat-session`: 定义编辑器会话窗口在 AI 生成期间的流式输出、进行中状态、思维链可见性与完成态收敛规则。

### Modified Capabilities
- `project-data`: 调整项目消息模型的 requirement，使 assistant 消息在流式生成完成后能够稳定落地最终内容与结构化 thinking steps，同时明确中间态不应作为正式持久化记录。

## Impact

- 受影响代码：`src/pages/editor/EditorPage.tsx`、`src/components/ui/thought-chain.tsx`、`src/services/ai/openai-compatible-ai-service.ts`、`src/services/project/*`、相关 store / type 定义与消息持久化映射。
- 受影响系统：AI 响应解析、前端会话渲染、项目消息持久化、Playwright 对话 UI 验证。
- 依赖与验证：需要补充流式与思维链展示的 UI 自动化验证，并继续遵循 Definition / Delivery / Closure 三阶段与 task 级独立 commit 约束。
