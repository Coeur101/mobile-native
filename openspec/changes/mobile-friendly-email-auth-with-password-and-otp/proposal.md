## Why

当前项目刚完成邮箱 OTP 登录接入，但认证模型仍偏单一路径，不足以支撑移动端长期使用场景。现在需要把邮箱认证升级为更符合手机操作习惯的体系：首次注册完成邮箱验证并设置密码，后续登录可在验证码登录和密码登录之间选择，同时客户端默认保留一周登录态，减少重复操作。

## What Changes

- 将当前“仅邮箱 OTP / magic link 登录”升级为“移动端友好的邮箱注册与登录体系”。
- 新增邮箱注册流程：输入邮箱、发送验证码、完成邮箱验证、设置密码、创建账号。
- 新增双模式登录流程：支持邮箱验证码登录，支持邮箱密码登录，不要求每次登录都同时输入密码和验证码。
- 为高风险场景预留二次验证码校验能力，但不把完整强制双因子作为本次默认日常登录路径。
- 将客户端登录态策略调整为默认保留 7 天，超过 7 天后强制重新登录。
- 补充密码相关边界：密码设置、密码校验、密码重置/找回入口、登录失败提示。
- 配置当前用户表与项目表，将认证用户、项目归属、项目版本与消息记录映射到明确的数据模型。
- 更新移动端认证 UI、会话恢复逻辑、测试策略与文档说明。
- 所有本次生成的功能测试、Playwright UI 测试、截图、trace、report 等验证产物仍按项目规则视为临时文件，记录结果后必须删除。

## Capabilities

### New Capabilities
- `user-auth`: 覆盖移动端优先的邮箱注册、密码登录、验证码登录、7 天会话保持与密码重置边界。
- `project-data`: 覆盖当前用户表、项目表、项目版本、项目消息与用户设置的初始配置及归属关系。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/services/auth/*`
  - `src/pages/login/*`
  - `src/router.tsx`
  - `src/lib/local-db.ts`
  - `src/services/project/*`
  - `src/stores/use-auth-store.ts`
  - `src/types/index.ts`
  - Supabase 用户/项目相关表配置与数据接入文档
  - 认证相关测试配置与文档
- External systems:
  - Supabase Auth
  - Supabase Database
  - 自定义 SMTP 服务，例如 Resend Free
- Product impact:
  - 登录与注册将从单步 OTP 流程升级为移动端分步认证流程
  - 登录态默认保留 7 天
  - 当前用户与项目数据将从仅本地 mock 持久化走向有明确归属关系的数据表配置
  - 微信登录仍不在本次范围内
