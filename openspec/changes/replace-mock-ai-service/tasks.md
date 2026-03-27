## 1. Definition and Review

- [x] 1.1 Complete the `design_review` for the AI generation boundary and confirm this change replaces only the runtime mock AI dependency, not the settings backend scope.
- [x] 1.2 Register `replace-mock-ai-service` in `TASK.json` with quality gates and append-only `logs/<task-id>.jsonl` history paths.

## 2. AI Boundary Delivery

- [x] 2.1 Implement a real AI service boundary that resolves model settings and issues OpenAI-compatible generation requests.
- [x] 2.2 Wire project creation and continuation to the real AI service, remove the runtime `mockAIService` dependency, and surface actionable Chinese errors.
- [x] 2.3 Add Vitest coverage for AI configuration validation, response parsing, and project-generation integration.

## 3. Verification and Closure

- [ ] 3.1 Complete the `implementation_review` and confirm implementation, tests, docs, and ledger entries remain aligned.
- [ ] 3.2 Run targeted verification and build checks, clean one-off artifacts after evidence capture, and record an independent verification commit.
- [ ] 3.3 Sync main specs/docs, refresh harness state, and archive the change.
