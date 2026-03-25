# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed

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
