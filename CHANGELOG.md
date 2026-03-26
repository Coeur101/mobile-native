# AI Web Builder Mobile CHANGELOG

## [Unreleased]

### Attempted

- 暂无

### Completed

- 初始化 task 级闭环工作流编排：新增 OpenSpec workflow change、development-workflow 规范、TASK.json 质量门结构与追加式 task history 约定
- 明确 user-facing task 必须执行 Playwright 自动化 UI 测试，并规定临时生成测试文件与测试产物在记录结果后必须删除
- 将项目工作流扩展为 Definition / Delivery / Closure 三阶段，并拆分 design_review 与 implementation_review 两个 review 节点

### Reverted

- 暂无

---

## 2026-03-25（MVP 前端对齐）

### Attempted

- 评估 shadcn/ui 方案，最终改为轻量自研 UI 组件路线

### Completed

- 新增 Dialog、VersionPanel、CodeBlock、Skeleton、ErrorBoundary、PageTransition、PulsingDots、ThoughtChain 等 UI 组件
- 完成首页搜索、状态筛选、项目删除确认、版本恢复、编辑页项目重命名等交互能力
- 引入 Motion、highlight.js、主题系统与全局动画常量
- 重构 EditorPage 为全屏对话式布局，并为 AI 回复加入 thinkingSteps 展示
- 完成预览页 iframe 展示、代码模式切换和导出能力
- 优化主题样式、按钮形态、页面转场和 Toast 位置
- 新增 `docs/PRD.md`
- 修复中英文标题、空状态动画冲突、iframe sandbox 警告等问题

### Reverted

- 暂无

## 2026-03-25（项目初始化）

### Attempted

- 评估 React Native + WebView 方案，最终选定 React + Capacitor 路线

### Completed

- 初始化结构化项目模型与 mock 认证、AI、项目、设置服务
- 新增登录页、项目列表页、编辑页、预览页、设置页
- 初始化 Capacitor Android 工程并完成 Android 同步
- 接入 GitHub Actions Debug APK 构建流程
- 修复 Android 构建权限、旧样式依赖残留与包管理切换问题
- 将早期 code 模型升级为 `files/messages/versions` 结构
- 同步 README 与项目治理文档

### Reverted

- 暂无
