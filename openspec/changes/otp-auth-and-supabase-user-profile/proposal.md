## Why

当前认证体系仍然把密码登录、验证码登录、注册后设密码、密码找回同时堆叠在登录入口，导致 App 端交互模型不统一，用户资料也仍以本地快照为主而不是 Supabase 下的正式记录。现在需要把登录统一收敛为邮箱验证码路径，同时把用户资料、头像和密码安全能力迁移为以 Supabase 为准的账户体系，为后续移动端长期使用打下稳定边界。

## What Changes

- **BREAKING** 登录入口统一改为邮箱验证码验证，不再把密码作为日常登录入口暴露在登录页。
- **BREAKING** 注册流程改为“邮箱验证码完成验证后直接创建账户并生成默认昵称、默认头像”，不再要求首次注册时立即设置密码。
- 新增个人信息能力：主页右上角入口从“设置”改为“用户信息”，进入后展示头像、昵称、邮箱、主题切换和账户安全能力。
- 新增用户资料云端化：用户昵称、头像、密码配置状态等资料改为存储在 Supabase 用户资料记录中，不再以本地持久化作为权威来源。
- 新增头像策略：支持用户上传头像，客户端先压缩再转为 base64，最终保存到 Supabase 资料记录，避免引入路径型文件存储方案。
- 新增安全增强路径：密码改为登录后的可选安全能力；未设置密码时展示“设置密码”，已设置密码时展示“重置密码”，两者都必须先通过邮箱验证码确认。
- 收缩原设置页范围，仅保留主题切换；Base URL、API Key、备注等当前本地演示型设置从主要用户入口中移除。

## Capabilities

### New Capabilities
- `user-profile`: 定义用户个人资料页、默认昵称与默认头像、头像上传压缩与 base64 存储、资料云端持久化以及密码安全设置入口。

### Modified Capabilities
- `user-auth`: 将认证主路径从“密码 + 验证码并存”收敛为“验证码为唯一登录入口，密码为登录后安全增强能力”。
- `project-data`: 将当前用户资料记录从本地快照升级为 Supabase 下的正式 profile backing record，并补充头像与密码状态字段边界。
- `auth-entry-ui`: 将认证入口从多模式登录切换调整为统一验证码认证入口，并收敛注册/重置等路径的页面交互层级。

## Impact

- 受影响代码与页面：
  - `src/pages/login/LoginPage.tsx`
  - `src/pages/settings/SettingsPage.tsx`
  - `src/pages/home/HomePage.tsx`
  - `src/router.tsx`
  - `src/services/auth/*`
  - `src/lib/local-db.ts`
  - `src/types/index.ts`
- 受影响系统：
  - Supabase Auth OTP 流程
  - Supabase 用户资料表/资料记录
  - 本地会话恢复与资料缓存策略
  - App 端用户入口与个人信息页导航
- 受影响验证：
  - 登录入口与个人信息页都属于 user-facing task，必须补 Playwright UI 自动化验证。
