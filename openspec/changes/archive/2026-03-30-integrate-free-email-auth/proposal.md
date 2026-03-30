## Why

当前登录页仍然依赖本地 mock 用户，这会阻塞真实会话、账号隔离和后续云端项目归属。现在需要优先把邮箱登录落到可用的免费方案上，让认证链路先从假登录变成真实登录，同时暂时取消微信登录接入范围，避免把不确定能力混入本次实现。

## What Changes

- 将邮箱登录从 mock 切换为真实认证，优先采用与现有项目路线一致的免费优先方案。
- 以邮箱 OTP / magic link 作为首选登录模式，而不是在当前阶段引入完整密码体系。
- 引入真实会话管理、登录恢复和用户资料持久化，替换本地假用户状态。
- 调整登录页与认证服务，去掉本次变更中的微信登录实现目标，仅保留后续可再规划的空间。
- 补充邮箱登录所需的环境变量、错误态、回调约束和验证任务。

## Capabilities

### New Capabilities
- `user-auth`: 覆盖真实邮箱登录、会话持久化、认证回调、登录失败处理与已登录状态恢复。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/services/auth/*`
  - `src/pages/login/LoginPage.tsx`
  - `src/router.tsx`
  - `src/lib/local-db.ts`
  - `src/types/index.ts`
  - 认证相关环境变量与接入文档
- External systems:
  - Supabase Auth
  - 自定义 SMTP 服务商，例如 Resend Free
- Product impact:
  - 邮箱登录将进入真实可用状态
  - 微信登录不在本次变更中实现，避免范围扩散
