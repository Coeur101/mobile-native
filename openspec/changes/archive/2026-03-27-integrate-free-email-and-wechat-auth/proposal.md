## Why

当前登录页仍然使用本地 mock，会阻塞真实账号体系、项目绑定和后续云端数据隔离。现在需要尽快把邮箱登录落到可用的免费方案上，并把微信登录从“假入口”升级成“真实可接入、但明确受成本约束”的路径，避免继续把不存在的零成本微信方案当成可实施目标。

## What Changes

- 将邮箱登录从 mock 切换为真实认证，优先使用现有技术路线兼容的免费方案。
- 新增邮箱登录模式选择，支持密码登录或邮箱 OTP / magic link 方案的实现预留。
- 引入真实会话管理与用户资料持久化，不再依赖本地假用户状态。
- 将微信登录改造成配置驱动的 provider 接入路径，明确区分“可显示按钮”和“具备真实凭据可完成登录”。
- 为微信登录增加成本边界与能力门控：当未配置微信开放平台资质和凭据时，界面与服务层必须表现为受限状态，而不是继续伪装成功登录。
- 补充认证相关的错误态、回调处理、环境变量约束和验证任务。

## Capabilities

### New Capabilities
- `user-auth`: 覆盖邮箱真实登录、微信登录接入路径、会话持久化、provider 能力门控与登录回调流程。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/services/auth/*`
  - `src/pages/login/LoginPage.tsx`
  - `src/router.tsx`
  - `src/lib/local-db.ts`
  - `src/types/index.ts`
  - 认证相关环境变量与配置文档
- External systems:
  - Supabase Auth
  - 自定义 SMTP 服务商，例如 Resend Free
  - 微信开放平台 / 微信认证资质（仅在启用真实微信登录时）
- Product impact:
  - 邮箱登录可以在免费额度内先落地真实能力
  - 微信登录将从“mock 成功”改为“真实接入或明确受限”，避免误导
