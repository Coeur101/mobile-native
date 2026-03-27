# AI Web Builder Mobile CHANGELOG

## [未发布]

### 尝试中

- 暂无

### 已完成

- 登录页 UI 改为更紧凑的移动端认证页：移除过度引导文案和测试性说明，压缩顶部信息区与入口切换区
- 登录与注册升级为移动端分步式邮箱认证：支持注册后设密码、密码登录、验证码登录与密码重置入口
- 客户端登录态显式保留 7 天，过期后会清理本地状态并要求重新登录
- 当前用户、项目、项目版本、项目消息与用户设置建立了明确的本地归属模型，便于后续迁移到 Supabase 表
- 接入 Supabase Auth 邮箱 OTP / 验证码登录与 `/login` 会话回调恢复，替换本地 mock auth
- 登录页改为发送邮箱验证码并支持验证码校验，且明确移除微信登录的误导入口
- 补充 `.env.example`、`docs/auth-email-setup.md`、`vitest.config.ts`、`playwright.config.ts` 以支持免费优先邮箱认证与自动化验证
- 初始化 task 级闭环工作流编排：新增 OpenSpec workflow change、development-workflow 规范、`TASK.json` 质量门禁结构与追加式 task history 约定
- 明确 user-facing task 必须执行 Playwright 自动化 UI 测试，并规定临时生成测试文件与测试产物在记录结果后必须删除
- 将项目工作流扩展为 Definition / Delivery / Closure 三阶段，并拆分 `design_review` 与 `implementation_review` 两个 review 节点
- 收紧 task 级提交闭环：每个交付型 task 完成后必须独立 commit，并在 `TASK.json` 与 task history 中记录可追溯提交证据

### 已回退

- 暂无

---

## 2026-03-25（MVP 前端对齐）

### 尝试中

- 评估 shadcn/ui 方案，最终改为轻量自研 UI 组件路线

### 已完成

- 新增 Dialog、VersionPanel、CodeBlock、Skeleton、ErrorBoundary、PageTransition、PulsingDots、ThoughtChain 等 UI 组件
- 完成首页搜索、状态筛选、项目删除确认、版本恢复、编辑页项目重命名等交互能力
- 引入 Motion、highlight.js、主题系统与全局动画常量
- 重构 EditorPage 为全屏对话式布局，并为 AI 回复加入 thinkingSteps 展示
- 完成预览页 iframe 展示、代码模式切换和导出能力
- 优化主题样式、按钮形态、页面转场和 Toast 位置
- 新增 `docs/PRD.md`
- 修复中英文标题、空状态动画冲突、iframe sandbox 警告等问题

### 已回退

- 暂无

## 2026-03-25（项目初始化）

### 尝试中

- 评估 React Native + WebView 方案，最终选定 React + Capacitor 路线

### 已完成

- 初始化结构化项目模型与 mock 认证、AI、项目、设置服务
- 新增登录页、项目列表页、编辑页、预览页、设置页
- 初始化 Capacitor Android 工程并完成 Android 同步
- 接入 GitHub Actions Debug APK 构建流程
- 修复 Android 构建权限、旧样式依赖残留与包管理切换问题
- 将早期 code 模型升级为 `files/messages/versions` 结构
- 同步 README 与项目治理文档

### 已回退

- 暂无

## 2026-03-27

### Added
- 接入 Chrome DevTools MCP 到 Codex 全局配置，补充真实浏览器可视化验收与调试能力。
- 新增 `docs/chrome-devtools-mcp.md`，明确 Chrome MCP 与 Playwright 的职责边界和使用方式。

### Changed
- 明确项目 UI 验证采用双轨模式：Playwright 负责自动化闭环，Chrome DevTools MCP 负责人工验收与问题排查。
