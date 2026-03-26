## 1. Auth Foundation

- [x] 1.1 确认 Supabase Auth 邮箱登录所需的环境变量、客户端配置和 SMTP 配置字段
- [x] 1.2 更新认证相关类型与 `AuthService` 接口，移除本次实现对微信登录的依赖
- [x] 1.3 为真实会话和本地持久化迁移准备新的用户状态读写结构

## 2. Real Email Authentication

- [x] 2.1 引入 Supabase Auth 邮箱 OTP / magic link 登录封装，替换现有 mock email login
- [x] 2.2 在登录页接入真实邮箱登录交互，并处理 loading、成功、失败与重试状态
- [x] 2.3 实现认证回调、会话恢复和受保护路由的真实登录判定

## 3. Scope Cleanup

- [x] 3.1 从本次实现范围中移除微信登录交付目标，并避免界面误导为“已支持真实微信登录”
- [x] 3.2 清理或改造与 mock auth 绑定的本地假用户逻辑

## 4. Verification and Documentation

- [x] 4.1 为真实邮箱登录和会话恢复补充功能测试
- [x] 4.2 为登录页真实邮箱认证流程补充 Playwright UI 测试，并在记录结果后清理临时测试产物
- [x] 4.3 更新 `PROJECT.md`、`docs/PRD.md`、`CHANGELOG.md` 和接入文档，说明免费优先邮箱方案与本次不含微信范围
