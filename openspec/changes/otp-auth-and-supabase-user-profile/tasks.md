## 1. Definition 阶段

- [x] 1.1 在 `TASK.json` 中登记本 change 的交付任务，明确每个 task 的 phase、质量门禁、日志路径、测试责任与 one-task-one-commit 要求
- [x] 1.2 完成认证与资料模型的 `design_review`，记录 Supabase profile、`has_password`、默认昵称、默认头像与本地缓存边界的确认结果到 change 日志
- [x] 1.3 完成入口与页面信息架构的 `design_review`，确认登录页 OTP-only、主页用户入口、个人信息页承载主题切换与安全能力、旧 `/settings` 收缩策略

## 2. Delivery 阶段：资料模型与认证底座

- [ ] 2.1 实现 Supabase 用户资料记录模型与默认资料生成逻辑，补齐昵称、头像 base64、邮箱、密码状态等字段，并完成该 task 的日志登记与独立 commit
- [ ] 2.2 调整本地持久化与会话恢复逻辑，使用户资料只作为缓存使用，应用恢复时始终以 Supabase profile 为准，并完成该 task 的日志登记与独立 commit
- [x] 2.3 收敛认证服务为 OTP-first 模型，统一邮箱验证码登录/注册完成逻辑，并为资料页内的密码安全操作预留验证码确认能力，同时完成该 task 的日志登记与独立 commit

## 3. Delivery 阶段：界面与交互落地

- [x] 3.1 重构登录页为移动端友好的邮箱验证码单一路径，移除密码登录主入口并补齐对应 UI 自动化验证、临时测试清理、日志记录与独立 commit
- [ ] 3.2 新增个人信息页并替换主页右上角入口，统一展示默认头像、默认昵称、邮箱与主题切换，收缩旧设置页职责，并完成对应 UI 自动化验证、临时测试清理、日志记录与独立 commit
- [ ] 3.3 实现头像上传压缩后转 base64 存储到 Supabase profile，以及资料页内“设置密码 / 重置密码”的邮箱验证码确认流程，并完成对应功能验证、UI 自动化验证、临时测试清理、日志记录与独立 commit

## 4. Review 阶段

- [ ] 4.1 完成资料模型与认证链路的 `implementation_review`，核对实现与 proposal、design、specs、TASK.json、task logs 的一致性并记录结论
- [ ] 4.2 完成页面导航、个人信息交互与安全流程的 `implementation_review`，确认 UI、数据流、验证码校验与旧设置收缩结果符合设计并记录结论

## 5. Closure 阶段

- [ ] 5.1 执行本 change 所需的构建、功能测试与 Playwright UI 测试，写回验证证据到 TASK.json 与 task logs，并删除一次性测试文件、报告、截图、trace、视频等临时产物后完成独立 commit
- [ ] 5.2 同步需要落入主线的文档与 specs，确认所有 task 无 blocker 且提交证据可追溯，随后关闭并归档 `otp-auth-and-supabase-user-profile`
