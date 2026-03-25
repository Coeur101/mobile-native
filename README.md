# AI Web Builder Mobile

AI-native 移动端网页生成器前端工程。当前阶段重点是把前端页面、交互和工程结构对齐产品方案，并预留邮箱登录、微信登录、Supabase 和真实 AI 的接入入口。

## 当前能力

- 登录页：邮箱登录入口 + 微信登录入口，均为 mock
- 项目列表页：本地项目管理
- 编辑页：对话、文件、预览、历史四个 Tab
- 预览页：基于结构化文件集渲染与导出
- 设置页：用户级设置，本地保存
- 安卓打包：通过 Capacitor 预留 Android 壳

## 启动命令

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`
- Web 构建：`pnpm build`
- 安卓同步：`pnpm android:sync`
- 打开 Android 工程：`pnpm android:open`
- 本地调试 APK：`pnpm android:apk:debug`

## GitHub Actions

- 已新增 `.github/workflows/android-apk.yml`
- 当代码推送到 `main` 或 `master`，或手动触发工作流时，会自动：
  - 安装 `pnpm`
  - 安装依赖
  - 构建 Web 资源
  - 同步 Capacitor Android
  - 执行 `assembleDebug`
  - 上传 `app-debug.apk` 作为构建产物

## 本地 APK 构建前提

- 本地执行 `pnpm android:apk:debug` 需要预先安装 JDK 并设置 `JAVA_HOME`
- GitHub Actions 已在工作流中通过 `actions/setup-java` 自动安装 Java 21

## 数据与认证边界

- 认证：当前仅 mock，不接真实邮箱/微信
- 数据：当前仅 localStorage，不接真实 Supabase
- AI：当前仅结构化 mock generator，不接真实模型

后续真实接入会通过 `src/services` 层替换实现，而不是重写页面。
