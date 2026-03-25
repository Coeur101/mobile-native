# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- 新增 Dialog 通用对话框组件，支持确认/取消/危险操作样式（2026-03-25）
- 新增项目删除二次确认对话框，防止误删（2026-03-25）
- 新增 VersionPanel 版本历史侧滑面板，支持查看版本列表和恢复历史版本（2026-03-25）
- 新增 CodeBlock 代码高亮组件，集成 highlight.js，支持 HTML/CSS/JS 语法高亮和行号显示（2026-03-25）
- 新增自定义 highlight.js 暗色主题，适配项目紫色品牌色（2026-03-25）
- 新增首页项目搜索功能，支持按名称和描述模糊搜索（2026-03-25）
- 新增首页项目状态筛选标签（全部/草稿/进行中/已归档）（2026-03-25）
- 新增 Skeleton 骨架屏组件和项目列表骨架屏（2026-03-25）
- 新增全局 ErrorBoundary 错误边界组件，捕获运行时错误并提供重试按钮（2026-03-25）
- 新增编辑页项目名称点击编辑功能，支持重命名（2026-03-25）
- ProjectService 接口新增 restoreProjectVersion 和 updateProjectMeta 方法（2026-03-25）
- 新增 PRD 产品需求文档 docs/PRD.md（2026-03-25）
- 新增 motion (Framer Motion v12+) 动画库依赖（2026-03-25）
- 新增 ThemeProvider 主题系统：Zustand store + html class 切换，支持亮色/暗色/自动三种模式（2026-03-25）
- 新增 PageTransition 页面转场组件（2026-03-25）
- 新增 PulsingDots 脉冲加载指示器组件（2026-03-25）
- 新增 ThoughtChain 思维链组件：垂直时间线 + 4 种状态图标 + 可折叠内容，参照 Ant Design X ThoughtChain 模式（2026-03-25）
- 新增动画常量模块 src/lib/animations.ts（2026-03-25）
- ProjectMessage 类型扩展 thinkingSteps 字段，支持 AI 多步推理展示（2026-03-25）

### Changed

- 重写 theme.css：冷灰 slate 色调替换为温暖柔和色调 + 紫色品牌色 + 暗色主题（2026-03-25）
- EditorPage 从分栏 Tabs 布局重构为全屏聊天布局：头像气泡 + 底部吸底输入栏 + 欢迎状态模板卡片（2026-03-25）
- 全部 5 个页面按钮改为纯图标，移除文字占用，用 title 属性提供提示（2026-03-25）
- 动画优化：PageTransition 仅用 opacity 动画，hover 效果改用 CSS transition，移除 layout/stagger 重绘动画（2026-03-25）
- Input 组件主题适配 + 焦点紫色发光效果（2026-03-25）
- Tabs 组件主题适配色彩（2026-03-25）
- mock AI 服务生成带 5 步思维链的 AI 回复（2026-03-25）
- 整理项目目录结构：将 App.tsx 和 router.tsx 从 src/app/ 提升到 src/，删除 src/app/ 下 46+ 个 shadcn/ui 死代码组件、5 个旧页面和冗余类型/工具文件，清理 tsconfig.json exclude 条目（2026-03-25）

### Fixed

- 修复页面标题为 "Untitled"，改为 "AI Web Builder"，并添加 SVG emoji favicon（2026-03-25）
- 修复项目名称中中文标点被替换为连字符的问题，改用原文截取作为项目名称（2026-03-25）
- 修复首页空状态与项目列表同时显示的 AnimatePresence 动画竞态问题（2026-03-25）
- 修复预览页 iframe sandbox 同时含 allow-scripts 和 allow-same-origin 的安全警告（2026-03-25）
- Toast 通知从 top-center 改为 bottom-center + 80px offset，避免遮挡顶部导航栏，符合移动端操作习惯（2026-03-25）

### Changed

- 设置页主题切换按钮添加中文文字标签（浅色/自动/深色）（2026-03-25）
- 设置页保存按钮从纯图标圆形改为带"保存设置"文字的完整按钮（2026-03-25）
- index.html lang 属性从 "en" 改为 "zh-CN"（2026-03-25）

## 2026-03-25

### Added

- 新增结构化项目模型、mock 认证服务、mock AI 服务、mock 项目服务和用户设置服务
- 新增登录页、项目列表页、编辑页、预览页、设置页，并将编辑页升级为对话/文件/预览/历史四个 Tab
- 初始化 Capacitor Android 工程并完成 `cap sync android`，预留后续 deep link 与真实认证回调入口
- GitHub Actions 自动构建 Debug APK 工作流，推送代码后自动更新 `latest-apk` Release

### Fixed

- 修复 GitHub Actions 中 `android/gradlew` 无执行权限导致的 APK 构建失败
- 清理旧样式依赖残留，修复构建过程中 `tw-animate-css` 缺失导致的失败

### Changed

- 切换构建工具到 pnpm
- 将原型式 `code` 数据升级为 `files / messages / versions` 结构，并增加旧数据迁移逻辑
- 更新 README、AGENTS.md，统一为 pnpm 命令并补充 CI 说明
