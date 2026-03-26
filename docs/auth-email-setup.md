# 邮箱认证接入说明

本次变更使用 `Supabase Auth` 作为统一认证后端，并同时支持：

- 邮箱验证码 / OTP 登录
- 邮箱密码登录
- 注册时先验证邮箱，再设置密码
- 密码找回 / 重置
- 客户端 7 天登录态恢复

## 必填环境变量

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_EMAIL_REDIRECT_TO`
- `VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO`（推荐配置）

默认推荐将登录回调地址配置为当前应用的 `/login`，密码重置回调带上 `mode=recovery`，例如：

```env
VITE_SUPABASE_EMAIL_REDIRECT_TO=http://localhost:5173/login
VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO=http://localhost:5173/login?mode=recovery
```

## 免费优先 SMTP 建议

Supabase Auth 可以直接使用自定义 SMTP。免费阶段建议：

- SMTP 服务：Resend Free
- 发件场景：登录 magic link / OTP 邮件
- 域名：至少先完成发信域名验证

对应环境变量如下：

```env
VITE_SUPABASE_SMTP_HOST=smtp.resend.com
VITE_SUPABASE_SMTP_PORT=465
VITE_SUPABASE_SMTP_USER=resend
VITE_SUPABASE_SMTP_PASSWORD=<resend-api-key>
VITE_SUPABASE_SMTP_SENDER_EMAIL=login@example.com
VITE_SUPABASE_SMTP_SENDER_NAME=AI Web Builder
```

注意：这些 SMTP 变量只用于记录部署配置要求，真正的 SMTP 凭证仍应配置在 Supabase 项目后台。

## 当前范围

- 已接入：移动端分步式邮箱注册、密码登录、验证码登录、密码重置入口、会话恢复、受保护路由
- 登录态策略：客户端默认保留 7 天，超过 7 天会清理本地登录态并要求重新登录
- 数据归属：当前用户、项目、项目版本、项目消息、用户设置均已定义明确归属边界
- 未接入：微信登录
- 高风险二次验证码校验仅保留扩展位，不作为当前默认登录路径
