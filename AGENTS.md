# AI Web Builder Mobile

## 项目状态

- 当前阶段：前端 MVP 已对齐方案，认证和云端能力仅预留入口
- 真实接入状态：未接入 Supabase、未接入真实邮箱登录、未接入真实微信登录、未接入真实 AI
- 安卓状态：已初始化 `Capacitor` 与 `android/` 工程，并完成 `cap sync android`
- CI 状态：已新增 GitHub Actions 工作流，推送代码后自动构建 Debug APK、上传 artifact，并更新 `latest-apk` Release
- 本地 APK 构建状态：命令链路已验证到 Gradle 启动阶段，本机缺少 `JAVA_HOME`，需安装 JDK 后再本地出包

## 启动与构建

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`
- Web 构建：`pnpm build`
- 安卓同步：`pnpm android:sync`
- 打开 Android 工程：`pnpm android:open`
- 本地调试 APK：`pnpm android:apk:debug`
- JDK 要求：本地打包前需设置 `JAVA_HOME`

## 技术栈

- React 19 + TypeScript
- Vite 7 + Tailwind CSS v4
- Zustand 状态管理
- React Router 7
- Capacitor 8（Android）
- pnpm 包管理

## 当前目录结构

```text
src/
  App.tsx             应用根组件
  router.tsx          路由配置
  main.tsx            挂载入口
  components/ui/      轻量 UI 组件（Input, Tabs）
  pages/              页面（按功能分组）
    login/            登录页
    home/             项目列表页
    editor/           编辑页
    preview/          独立预览页
    settings/         用户设置页
  services/           业务服务层
    auth/             认证服务（mock）
    ai/               AI 服务（mock）
    project/          项目服务（mock）
    settings/         设置服务（mock）
  stores/             Zustand 状态
  features/           业务配置数据
    auth/             认证提供商标签
    project/          提示词模板
  lib/                工具库
    local-db.ts       localStorage 封装
    render-project.ts 预览文档拼装
  types/              共享类型定义
  styles/             样式与主题
android/              Capacitor Android 工程
```

## 当前页面与路由

- `/login`：邮箱登录入口 + 微信登录入口，全部为 mock
- `/`：项目列表页
- `/editor/:projectId?`：编辑页，包含对话、文件、预览、历史四个 Tab
- `/preview/:projectId`：独立预览页
- `/settings`：用户级设置页

## 当前 mock 边界

- 登录：本地会话模拟
- 项目数据：`localStorage`
- AI 生成：结构化 mock generator
- 版本历史：本地快照
- 设置：本地保存

## 后续真实接入位

- `services/auth`：切换到邮箱登录和微信登录真实实现
- `services/project`：切换到 Supabase 数据读写
- `services/ai`：切换到 Edge Function 或其他 AI 代理
- `services/settings`：切换到用户级云端设置
- `capacitor.config.ts`：补充 deep link 和认证回调
- `android/`：后续补充签名、图标、deep link、微信回调和真实发布配置
- `.github/workflows/android-apk.yml`：当前会自动更新 `latest-apk` Release，后续可升级为 release 签名包、AAB、自动发布

## 维护规则

- 页面路由变更时同步更新本文件
- 启动命令、构建命令变更时同步更新本文件
- 新增真实接入能力时，将 mock 边界改为真实状态
