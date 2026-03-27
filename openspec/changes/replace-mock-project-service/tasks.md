## 1. Definition and Review

- [x] 1.1 Complete the `design_review` for the project persistence boundary and confirm this change replaces only project data services, not the AI generation service.
- [x] 1.2 Register `replace-mock-project-service` in `TASK.json` with quality gates and append-only `logs/<task-id>.jsonl` history paths.

## 2. Persistence Boundary Delivery

- [x] 2.1 Implement the real project data service and unified export entry, removing direct page dependencies on `mockProjectService`.
- [x] 2.2 Deliver authenticated-user project, version, and message persistence with create, continue, metadata update, version save, version restore, and delete flows.
- [x] 2.3 Reduce `localDb` project responsibilities to cache plus legacy migration helpers, including per-user migration markers.

## 3. UI Integration and Verification

- [x] 3.1 Update Home, Editor, and Preview for async remote project access with explicit loading, empty, missing, and error states.
- [x] 3.2 Add Vitest coverage for project persistence, version restore, user isolation, and local migration.
- [x] 3.3 Add headed Playwright coverage for project creation/list restore, editor save, and version restore, then clean one-off test artifacts after evidence capture.

## 4. Closure

- [x] 4.1 Complete the `implementation_review` and confirm implementation, spec, ledger, verification evidence, and commit history remain aligned.
- [ ] 4.2 Sync `openspec/specs/project-data/spec.md`, `docs/PRD.md`, `PROJECT.md`, and `TASK.json`, then archive the change.
