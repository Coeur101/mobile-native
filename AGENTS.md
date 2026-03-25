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
- Motion (Framer Motion v12+) 动画
- Zustand 状态管理
- React Router 7
- Capacitor 8（Android）
- pnpm 包管理

## 当前目录结构

```text
src/
  App.tsx             应用根组件（含 ThemeProvider）
  router.tsx          路由配置（含 requireAuth 守卫）
  main.tsx            挂载入口
  components/ui/      轻量 UI 组件
    input.tsx         输入框（主题适配 + 焦点发光）
    tabs.tsx          标签页（主题适配）
    page-transition.tsx 页面转场动画（opacity 淡入）
    pulsing-dots.tsx  三点脉冲加载指示器
    thought-chain.tsx 思维链组件（垂直时间线 + 状态 + 折叠）
    dialog.tsx        通用对话框（遮罩 + 确认/取消 + 危险操作）
    code-block.tsx    代码高亮组件（highlight.js + 行号）
    version-panel.tsx 版本历史侧滑面板（时间线 + 恢复）
    skeleton.tsx      骨架屏组件（项目卡片/列表）
    error-boundary.tsx 全局错误边界（捕获 + 重试）
  pages/              页面（按功能分组）
    login/            登录页（渐变背景 + Logo 弹簧入场）
    home/             项目列表页（卡片 + FAB）
    editor/           聊天式编辑页（气泡对话 + 思维链 + 底部输入）
    preview/          独立预览页（预览/代码模式切换）
    settings/         用户设置页（主题切换 + API 配置）
  services/           业务服务层
    auth/             认证服务（mock）
    ai/               AI 服务（mock，生成带思维链的回复）
    project/          项目服务（mock）
    settings/         设置服务（mock）
  stores/             Zustand 状态
    use-editor-store.ts  编辑器 Tab 状态
    use-theme-store.ts   主题模式状态（light/dark/auto）
  features/           业务配置数据
    auth/             认证提供商标签
    project/          提示词模板
  lib/                工具库
    local-db.ts       localStorage 封装
    render-project.ts 预览文档拼装
    animations.ts     动画常量（缓动曲线、弹簧参数）
  types/              共享类型定义（含 ThinkingStep 思维链类型）
  styles/             样式与主题（温暖色调 + 亮暗双主题）
android/              Capacitor Android 工程
```

## 当前页面与路由

- `/login`：邮箱登录入口 + 微信登录入口，全部为 mock
- `/`：项目列表页（卡片列表 + 浮动新建按钮）
- `/editor/:projectId?`：聊天式编辑页，全屏对话气泡 + 底部输入栏 + 模板卡片 + AI 思维链展示
- `/preview/:projectId`：独立预览页（预览/代码双模式切换）
- `/settings`：用户级设置页（主题亮暗切换 + API 配置）

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

## Git Commit 规范

遵循 Conventional Commits。Commit message 使用中文。

| Type | 说明 | 触发发版 |
|---|---|---|
| `feat:` | 新功能 | minor bump |
| `fix:` | Bug 修复 | patch bump |
| `feat!:` / `fix!:` | 含破坏性变更 | major bump |
| `refactor:` | 重构 | 不发版 |
| `perf:` | 性能优化 | 不发版 |
| `style:` | 格式调整 | 不发版 |
| `test:` | 测试 | 不发版 |
| `docs:` | 文档 | 不发版 |
| `chore:` | 构建/工具 | 不发版 |
| `ci:` | CI 配置 | 不发版 |

示例：
```
feat: 添加微信登录真实接入
fix: 修复预览页白屏
refactor: 提取公共 Header 组件
```

## Git Push 规范

### 推送前必须完成

1. `pnpm build` 编译通过
2. 相关功能已验证可用
3. CHANGELOG.md 已更新（feat/fix 类型 commit）

### 推送目标

- 默认推送到 `master` 分支
- 推送后 CI 自动构建 APK 并上传 artifact
- CI 根据 commit 类型**自动判断是否发版**（见下方规则）

### 自动发版规则（CI 执行）

推送到 `master` 后，GitHub Actions 工作流自动执行：

1. **始终执行**：构建 APK → 上传 artifact → 更新 `latest-apk` 滚动 Release
2. **有 `feat:` 或 `fix:` commit**：额外创建版本 tag（如 `v0.2.0`）+ 正式 GitHub Release（附带 APK + 自动 release notes）
3. **仅 `refactor:/docs:/chore:` 等**：不创建 tag，不发正式 Release

版本号计算基于上一个 tag 到当前 HEAD 之间的 commit：
- `feat:` → **minor**（0.x.0）
- `fix:` → **patch**（0.0.x）
- `feat!:` / `fix!:` → **major**（x.0.0）
- 多种类型并存时取最高级别

### 禁止事项

- 禁止 `git push --force` 到 master
- 禁止跳过构建验证直接推送
- 禁止手动创建 `v*` 格式的 tag（由 CI 自动管理）

## 维护规则

- 页面路由变更时同步更新本文件
- 启动命令、构建命令变更时同步更新本文件
- 新增真实接入能力时，将 mock 边界改为真实状态
- Git 工作流或 CI 规则变更时同步更新本文件
