## 1. Definition and Review

- [x] 1.1 Register `fix-chat-session-streaming-and-thinking-chain` in `TASK.json` with definition, delivery, and closure tasks plus append-only `logs/<task-id>.jsonl` paths.
- [x] 1.2 Complete the `design_review` for streaming chat, draft-state boundaries, and final message persistence before delivery starts.

## 2. Streaming Chat Delivery

- [x] 2.1 Extend the AI service boundary to emit streaming assistant text and incremental thinking-step updates with an explicit generation lifecycle.
- [x] 2.2 Update project generation persistence so temporary streaming drafts stay outside authoritative `project.messages` until final completion.
- [x] 2.3 Refactor the editor chat session UI to render the active assistant draft, visible thought-chain progress, and `streaming` / `persisting` / `failed` states.
- [x] 2.4 Add targeted Vitest and Playwright coverage for streaming progress, thinking-chain visibility, final persistence, and failure handling.

## 3. Verification and Closure

- [x] 3.1 Complete the `implementation_review` and confirm code, specs, task ledger, and commit traceability stay aligned.
- [x] 3.2 Run build and targeted verification, record evidence, remove one-off artifacts, and capture the required independent commit references.
- [x] 3.3 Sync the main specs/docs to the implemented behavior and archive the change once all blockers are cleared.
