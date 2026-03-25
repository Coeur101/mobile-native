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

## 当前目录结构

```text
src/
  app/        应用入口、路由和 UI 公共组件
  components/ 本地轻量 UI 组件
  features/   业务特征数据和配置
  lib/        本地存储、预览拼装等工具
  pages/      login/home/editor/preview/settings 页面
  services/   auth/project/settings/ai mock 服务
  stores/     本地 UI 状态
  types/      共享类型
  styles/     样式与主题
android/      Capacitor Android 工程
```

## 当前页面与路由

- `/login`：邮箱登录入口 + 微信登录入口，全部为 mock
- `/`：项目列表页
- `/editor/:projectId?`：编辑页，包含对话、文件、预览、历史四个 Tab
- `/preview/:projectId`：独立预览页
- `/settings`：用户级设置页

## 当前实现要点

- 登录页同时展示邮箱登录和微信登录入口，均为 mock
- 编辑页采用 `对话 / 文件 / 预览 / 历史` 四个 Tab
- 项目数据采用结构化模型：`files / messages / versions`
- 旧版 `code` 与 `chatHistory` 数据会在读取时自动迁移
- 预览页使用文件集拼装 `srcDoc`，不是单段 HTML 字符串

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
