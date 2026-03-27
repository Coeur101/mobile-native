## 1. Auth Configuration Setup

- [ ] 1.1 明确免费优先认证方案，确定 Supabase Auth + 自定义 SMTP 的环境变量与配置字段
- [ ] 1.2 为微信登录定义 capability flag、凭据字段和 broker 配置约束
- [ ] 1.3 更新 `AuthService` 接口与相关类型，使其支持真实 provider 状态和错误返回

## 2. Real Email Authentication

- [ ] 2.1 引入 Supabase Auth 邮箱登录客户端封装，替换现有 mock email login 流程
- [ ] 2.2 在登录页接入真实邮箱登录交互，并处理 loading、成功、失败与重试状态
- [ ] 2.3 实现真实会话持久化与启动恢复，替换路由守卫对本地 mock 用户的依赖

## 3. WeChat Capability Gating

- [ ] 3.1 将微信登录从 mock 成功改为 capability-driven 行为
- [ ] 3.2 在未配置微信资质或 broker 时，显示明确受限提示并阻止伪登录
- [ ] 3.3 为未来真实微信 OAuth / broker 回调预留接口与状态机入口

## 4. Callback and Session Normalization

- [ ] 4.1 设计并实现认证回调处理入口，兼容 Web 与 Capacitor 场景
- [ ] 4.2 统一 email 和 WeChat 登录后的 `UserProfile` 与 session shape
- [ ] 4.3 清理或迁移与 mock auth 绑定的本地状态读写逻辑

## 5. Verification and Documentation

- [ ] 5.1 为邮箱真实登录和微信 capability gating 补充功能测试
- [ ] 5.2 为登录页真实认证与受限状态补充 Playwright UI 测试，并在记录结果后清理临时测试产物
- [ ] 5.3 更新 `PROJECT.md`、`docs/PRD.md`、`CHANGELOG.md` 和相关接入文档，说明免费方案边界与微信成本前提
