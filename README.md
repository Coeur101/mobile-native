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

- 安装依赖：`npm install`
- 本地开发：`npm run dev`
- Web 构建：`npm run build`
- 安卓同步：`npm run android:sync`
- 打开 Android 工程：`npm run android:open`

## 数据与认证边界

- 认证：当前仅 mock，不接真实邮箱/微信
- 数据：当前仅 localStorage，不接真实 Supabase
- AI：当前仅结构化 mock generator，不接真实模型

后续真实接入会通过 `src/services` 层替换实现，而不是重写页面。
