# AI Web Builder Mobile

## 项目概述

AI-native 安卓应用，用户通过自然语言对话生成网页项目，在 App 内完成预览、编辑和管理。当前处于 MVP 阶段，认证和云端能力仅预留入口。

## 技术栈

- React 19 + TypeScript
- Vite 7 + Tailwind CSS v4
- Motion (Framer Motion v12+) 动画
- Zustand 5 状态管理
- React Router 7
- Capacitor 8（Android）
- highlight.js 代码高亮
- Sonner Toast 通知
- pnpm 包管理

## 项目结构

```text
src/
  App.tsx             应用根组件（含 ThemeProvider）
  router.tsx          路由配置（含 requireAuth 守卫）
  main.tsx            挂载入口
  components/ui/      轻量 UI 组件（input, tabs, dialog, code-block, skeleton, error-boundary 等）
  pages/
    login/            登录页（渐变背景 + Logo 弹簧入场）
    home/             项目列表页（卡片 + FAB + 搜索筛选）
    editor/           聊天式编辑页（气泡对话 + 思维链 + 底部输入）
    preview/          独立预览页（预览/代码模式切换）
    settings/         用户设置页（主题切换 + API 配置）
  services/
    auth/             认证服务（mock）
    ai/               AI 服务（mock，带思维链）
    project/          项目服务（mock）
    settings/         设置服务（mock）
  stores/
    use-editor-store.ts  编辑器 Tab 状态
    use-theme-store.ts   主题模式（light/dark/auto）
  features/           业务配置数据（认证标签、提示词模板）
  lib/                工具库（localStorage 封装、预览拼装、动画常量）
  types/              共享类型定义
  styles/             样式与主题（温暖色调 + 亮暗双主题）
android/              Capacitor Android 工程
```

## 路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/login` | 登录页 | 邮箱 + 微信入口（mock） |
| `/` | 首页 | 项目卡片列表 + FAB |
| `/editor/:projectId?` | 编辑页 | 全屏聊天 + 底部输入 + 模板卡片 + 思维链 |
| `/preview/:projectId` | 预览页 | 预览/代码双模式 |
| `/settings` | 设置页 | 主题 + API 配置 |

## 启动方式

- 安装依赖: `pnpm install`
- 本地开发: `pnpm dev`
- Web 构建: `pnpm build`
- 安卓同步: `pnpm android:sync`
- 打开 Android 工程: `pnpm android:open`
- 本地调试 APK: `pnpm android:apk:debug`

## 环境依赖

- Node.js 24 LTS
- pnpm 10+
- JDK（本地 APK 构建需设置 `JAVA_HOME`）
- Android SDK（通过 Android Studio）

## 当前 Mock 边界

| 模块 | 当前状态 | 真实接入位 |
|---|---|---|
| 登录 | 本地会话模拟 | `services/auth` → 邮箱/微信真实认证 |
| 项目数据 | localStorage | `services/project` → Supabase |
| AI 生成 | 结构化 mock | `services/ai` → Edge Function / AI 代理 |
| 版本历史 | 本地快照 | `services/project` → Supabase |
| 设置 | 本地保存 | `services/settings` → 云端设置 |
