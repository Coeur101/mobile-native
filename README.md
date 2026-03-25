# AI Web Builder Mobile

<p align="center">
  <img src="./sandbox.png" alt="AI Web Builder Mobile App Icon" width="160" height="160" />
</p>

<p align="center">AI-native 移动端网页生成器前端工程，当前阶段聚焦于 MVP 体验打磨，并为真实认证、云端数据和 AI 能力预留接入入口。</p>

## 项目概览

- 当前阶段：前端 MVP 已对齐方案，认证和云端能力仅预留入口
- Web 技术栈：React 19、TypeScript、Vite 7、Tailwind CSS v4、React Router 7、Zustand、Motion
- 移动封装：Capacitor 8 Android
- 当前数据边界：登录、项目数据、AI 回复、设置均为本地 mock

## 当前功能

- 登录页：邮箱登录入口 + 微信登录入口，均为 mock
- 项目列表页：本地项目管理与快速创建
- 编辑页：对话、文件、预览、历史四个 Tab
- 预览页：基于结构化文件集渲染与导出
- 设置页：用户级设置，本地保存
- Android：已初始化原生工程并完成 `cap sync android`

## 快速开始

```bash
pnpm install
pnpm dev
```

常用命令：

- `pnpm build`：构建 Web 资源
- `pnpm android:sync`：同步 Web 资源到 Android 工程
- `pnpm android:open`：打开 Android Studio 工程
- `pnpm android:apk:debug`：本地构建 Debug APK

## 构建与发布

- 本地打包前需要先安装 JDK，并正确设置 `JAVA_HOME`
- GitHub Actions 会在推送后自动构建 Debug APK、上传 artifact，并更新 `latest-apk` Release
- 若本次提交包含 `feat:` 或 `fix:`，CI 会基于 Conventional Commits 自动生成版本号与正式 Release

## 图标资源说明

- 仓库根目录的 `sandbox.png` 是当前 App 图标母版
- Web 图标资源位于 `public/`
- Android 图标资源位于 `android/app/src/main/res/mipmap-*`
- 后续如果替换图标，请同步更新 README 展示图与各端导出资源，保持仓库展示和安装图标一致

## 开源协作规范

### 分支与提交流程

- 默认分支为 `master`
- 新功能或修复建议使用独立分支开发，再通过 Pull Request 合并
- 禁止直接向 `master` 强推：不要使用 `git push --force`

### Commit 规范

- 使用 Conventional Commits
- Commit message 使用中文
- 推荐格式：

```text
feat: 添加微信登录真实接入
fix: 修复预览页白屏
refactor: 提取公共 Header 组件
docs: 更新 README 中的开源协作说明
```

### 提交前自检

- 必须保证 `pnpm build` 通过
- 变更功能需要完成最基本的本地可用性验证
- 涉及 `feat:` 或 `fix:` 时同步更新 `CHANGELOG.md`
- 路由、命令、CI、真实接入边界变更时同步更新 `AGENTS.md` 与 README

### Pull Request 要求

- 说明改动目标、影响范围与验证方式
- UI 相关改动建议附截图或录屏
- 如涉及 Android 构建链路，请说明是否验证过 `pnpm android:sync` 或 APK 构建
- PR 范围应聚焦单一主题，避免将不相关重构混入同一次提交

### Issue 反馈要求

- 提供运行环境：系统、Node 版本、pnpm 版本
- 描述复现步骤、预期结果、实际结果
- 若是界面问题，请附截图；若是构建问题，请附关键日志
- 如问题与本地数据相关，请说明是否清理过 `localStorage`

### 文档与资源维护

- 新增页面、修改路由或构建命令时，必须同步维护文档
- 替换 App 图标时，需同时更新 `sandbox.png`、Web 图标资源、Android 图标资源和 README 展示图
- 不要在仓库中提交无来源的大体积二进制文件；新增资源需说明用途

## 当前 mock 边界

- 认证：本地会话模拟
- 项目数据：`localStorage`
- AI 生成：结构化 mock generator
- 版本历史：本地快照
- 设置：本地保存

后续真实接入会通过 `src/services` 层逐步替换实现，而不是重写页面。
