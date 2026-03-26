## 1. 认证模型基础层

- [x] 1.1 扩展认证类型、auth service 接口与本地持久化结构，支持密码登录、验证码登录、注册状态与 7 天 TTL
- [x] 1.2 在 Supabase 配置层补齐 password / OTP / password reset 所需环境变量与接入约定
- [x] 1.3 配置当前用户表、项目表、项目版本、项目消息与用户设置的数据模型边界及归属关系
- [x] 1.4 设计并登记本 change 的 delivery tasks 到 `TASK.json`，为每个 task 预留 `historyRef`、质量门禁与提交追溯字段

## 2. 移动端注册与登录流

- [x] 2.1 实现移动端分步式邮箱注册流程：邮箱输入、验证码发送与校验、密码设置、注册完成
- [x] 2.2 实现双模式登录流程：验证码登录与密码登录二选一，并处理失败、重试与状态切换
- [x] 2.3 实现密码找回 / 重置入口与相关 UI 状态
- [x] 2.4 更新路由守卫与 auth store，使 7 天内有效登录态可在应用启动时恢复，超期则强制回到登录态

## 3. 验证与工作流证据

- [x] 3.1 为注册、密码登录、验证码登录、7 天 TTL 恢复与超期清理补充功能测试
- [x] 3.2 为用户表和项目表配置补充数据模型验证或映射测试，确保用户归属关系明确
- [x] 3.3 为移动端认证主流程补充 Playwright UI 测试，覆盖注册、密码登录、验证码登录与过期后重登提示
- [x] 3.4 将功能测试、UI 测试和 build 结果写入对应 task history，并在记录后删除临时测试文件、report、trace、截图和 `test-results`
- [x] 3.5 完成 `design_review` 结果登记，并在实现完成后完成 `implementation_review` 结果登记

## 4. 文档与收口

- [x] 4.1 更新 `PROJECT.md`、`docs/PRD.md`、`CHANGELOG.md` 与认证接入文档，说明移动端优先认证策略、7 天会话规则与不默认强制双因子
- [x] 4.2 确认所有 delivery tasks 在 `TASK.json` 与 `logs/<task-id>.jsonl` 中证据完整、无 blocker，且每个 task 都已独立 commit 并记录 `commitRef`
- [x] 4.3 完成剩余 change 级收口记录 / push 检查，并在所有 task done 后归档该 change

> 收口备注：已执行 `git push --dry-run origin HEAD` 作为 push 检查，当前环境缺少远端凭据（`SEC_E_NO_CREDENTIALS`），因此本次仅完成本地归档与证据回写。
