## 1. Definition and Review

- [ ] 1.1 完成项目持久化边界的 `design_review`，确认本 change 只替换项目数据服务，不替换 AI 生成服务。
- [ ] 1.2 为 `replace-mock-project-service` 建立 `TASK.json` 台账、质量门禁和 `logs/<task-id>.jsonl` 追溯路径。

## 2. Persistence Boundary Delivery

- [ ] 2.1 实现真实项目数据服务并替换统一导出入口，收敛页面对 `mockProjectService` 的直接依赖。
- [ ] 2.2 落地 authenticated user 的项目、版本、消息读写与错误态处理，覆盖创建、续写、元数据更新、版本保存、版本恢复和删除。
- [ ] 2.3 将 `localDb` 的项目职责调整为缓存与 legacy 迁移辅助，并补充按用户过滤的迁移标记逻辑。

## 3. UI Integration and Verification

- [ ] 3.1 更新首页、编辑页、预览页以适配异步远端项目服务，补齐 loading / empty / error 状态。
- [ ] 3.2 为项目持久化、版本恢复、用户隔离和本地迁移补充 Vitest 覆盖。
- [ ] 3.3 为项目创建、列表恢复、编辑保存和版本恢复补充 Playwright UI 验证，并在记录结果后清理一次性测试产物。

## 4. Closure

- [ ] 4.1 完成 `implementation_review`，核对实现、spec、台账、验证证据与提交记录一致。
- [ ] 4.2 同步 `openspec/specs/project-data/spec.md`、`docs/PRD.md`、`PROJECT.md` 与 `TASK.json`，然后归档 change。
