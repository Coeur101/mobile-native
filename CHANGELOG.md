# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

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
