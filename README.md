# AI Web Builder Mobile

<p align="center">
  <img src="./sandbox.png" alt="AI Web Builder Mobile App Icon" width="160" height="160" />
</p>

<p align="center">
  AI 原生移动端网页生成器 — 通过自然语言对话，一键生成可预览、可导出的轻量网页项目，<br>
  并通过 Capacitor 封装为原生 Android 应用。
</p>

---

## 功能特性

- **邮箱认证** — 支持密码登录和邮箱 OTP 验证码登录，会话自动刷新与持久化
- **项目管理** — 创建、编辑、归档项目，数据持久化到 Supabase，支持多设备同步
- **AI 对话生成** — 输入自然语言需求，AI 生成完整的 HTML/CSS/JS 项目，支持流式输出和思考链展示
- **版本历史** — 每次生成自动保存版本快照，可随时查看和恢复到任意历史版本
- **实时预览** — 编辑器内嵌 WebView 预览，代码变更即时渲染
- **代码高亮** — 集成 highlight.js，生成的代码支持语法高亮展示
- **用户设置** — 支持自定义 AI 模型、Base URL 和 API Key，设置云端同步
- **主题切换** — 支持浅色/深色/跟随系统三种主题模式
- **Android 原生** — 基于 Capacitor 8 封装，支持构建原生 Android APK

## 技术栈

| 类别 | 技术 | 版本 |
| --- | --- | --- |
| UI 框架 | React + TypeScript | 19.1 / 5.9 |
| 构建工具 | Vite | 7.1 |
| 样式 | Tailwind CSS | 4.1 |
| 路由 | React Router | 7.13 |
| 状态管理 | Zustand | 5.0 |
| 动画 | Motion (Framer Motion) | 12.38 |
| 图标 | Lucide React | 0.487 |
| 后端 / 认证 | Supabase | JS SDK 2.100 |
| 移动封装 | Capacitor (Android) | 8.0 |
| 单元测试 | Vitest + jsdom | 4.1 |
| E2E 测试 | Playwright | 1.58 |
| 包管理器 | pnpm | 10.13 |

## 项目结构

```text
src/
├── components/ui/       # 通用 UI 组件（按钮、对话框、代码块等）
├── features/            # 功能模块（auth、project）
├── pages/               # 页面组件
│   ├── home/            # 项目列表页
│   ├── editor/          # 编辑器页（对话、文件、预览、历史）
│   ├── preview/         # 全屏预览页
│   ├── login/           # 登录页
│   ├── profile/         # 个人资料页
│   └── settings/        # 高级设置页
├── services/            # 业务服务层
│   ├── ai/              # AI 生成服务（OpenAI 兼容协议）
│   ├── auth/            # 认证服务（Supabase Auth）
│   ├── project/         # 项目服务（Supabase 持久化）
│   └── settings/        # 设置服务（Supabase 云端同步）
├── stores/              # Zustand 状态（auth、theme、globalStatus）
├── lib/                 # 工具函数（supabase 客户端、本地存储、动画）
├── styles/              # 全局样式
└── types/               # TypeScript 类型定义
```

## 快速开始

### 环境要求

- Node.js 24 LTS
- pnpm 10+
- Supabase 项目（用于认证和数据库）

### 安装与启动

```bash
# 克隆仓库
git clone <repo-url>
cd mobile-native

# 安装依赖
pnpm install

# 配置环境变量（见下方说明）
cp .env.example .env

# 启动开发服务器
pnpm dev
```

启动后访问 `http://localhost:5173`。

## 环境变量配置

复制 `.env.example` 到 `.env`，填写以下配置：

```bash
# Supabase 基础配置（必填）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 认证回调地址
VITE_SUPABASE_EMAIL_REDIRECT_TO=http://localhost:5173/login
VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO=http://localhost:5173/login?mode=recovery

# SMTP 邮件发送（推荐使用 Resend Free）
VITE_SUPABASE_SMTP_HOST=smtp.resend.com
VITE_SUPABASE_SMTP_PORT=465
VITE_SUPABASE_SMTP_USER=resend
VITE_SUPABASE_SMTP_PASSWORD=your-resend-api-key
VITE_SUPABASE_SMTP_SENDER_EMAIL=login@example.com
VITE_SUPABASE_SMTP_SENDER_NAME=AI Web Builder
```

> **提示：** SMTP 配置用于 Supabase Auth 发送验证码和密码重置邮件。推荐使用 [Resend](https://resend.com) 免费方案，完成域名验证后即可使用。

## 数据库迁移

项目使用 Supabase 管理数据库 Schema。迁移文件位于 `supabase/migrations/`：

```bash
# 方式一：通过 Supabase CLI 本地推送
supabase db push

# 方式二：在 Supabase Dashboard → SQL Editor 中手动执行迁移文件
```

主要数据表：

| 表名 | 用途 |
| --- | --- |
| `projects` | 项目元数据和文件 |
| `project_versions` | 版本历史快照 |
| `project_messages` | 对话消息记录 |
| `profiles` | 用户资料 |
| `user_settings` | AI 集成配置（模型、API Key 等） |

所有表均启用 **Row Level Security (RLS)**，确保用户只能访问自己的数据。

## 常用命令

```bash
pnpm dev                  # 启动开发服务器
pnpm build                # 构建生产版本
pnpm preview              # 预览生产构建
pnpm test                 # 运行单元测试
pnpm test:watch           # 监听模式运行单元测试
```

### Android 相关

```bash
pnpm android:sync         # 同步 Web 资源到 Android 工程
pnpm android:open         # 打开 Android Studio
pnpm android:apk:debug    # 构建 Debug APK
```

> 本地构建 APK 需要安装 JDK 并正确设置 `JAVA_HOME`。

## 测试

### 单元测试（Vitest）

位于 `tests/vitest/`，覆盖 AI 服务、项目服务、认证逻辑等核心模块：

```bash
pnpm test                 # 运行全部单元测试
pnpm test:watch           # 监听模式
```

### E2E 测试（Playwright）

位于 `tests/playwright/`，覆盖认证流程、编辑器交互、项目持久化等用户场景：

```bash
pnpm test:ui:auth         # 启动 Playwright UI 模式运行 E2E 测试
```

## Android 构建

项目通过 Capacitor 封装为 Android 原生应用：

1. **前置条件：** 安装 Android Studio 和 JDK 21
1. **构建流程：**

   ```bash
   pnpm build                    # 1. 构建 Web 资源
   pnpm android:sync             # 2. 同步到 Android 工程
   pnpm android:apk:debug        # 3. 构建 Debug APK
   ```

1. **CI/CD：** GitHub Actions 会在推送到 `master`/`main` 时自动构建 APK 并上传。如提交包含 `feat:` 或 `fix:`，会基于 Conventional Commits 自动创建 Release。

## 开源协作规范

### 分支与提交流程

- 默认分支为 `master`
- 新功能或修复建议使用独立分支开发，通过 Pull Request 合并
- 禁止向 `master` 强推（`git push --force`）

### Commit 规范

使用 **Conventional Commits**，commit message 使用中文：

```text
feat: 添加微信登录真实接入
fix: 修复预览页白屏
refactor: 提取公共 Header 组件
docs: 更新 README
test: 补充编辑器流式输出测试
chore: 升级 Vite 到 7.2
```

### 提交前自检

- `pnpm build` 必须通过
- 变更功能需完成基本本地可用性验证
- 涉及 `feat:` 或 `fix:` 时同步更新 `CHANGELOG.md`
- 路由、命令、CI 变更时同步更新 README

### Pull Request 要求

- 说明改动目标、影响范围与验证方式
- UI 相关改动建议附截图或录屏
- 涉及 Android 构建链路时，说明是否验证过 APK 构建
- PR 范围聚焦单一主题，避免无关重构混入

### Issue 反馈

- 提供运行环境：系统、Node 版本、pnpm 版本
- 描述复现步骤、预期结果、实际结果
- 界面问题附截图，构建问题附关键日志
- 本地数据相关问题时说明是否清理过 `localStorage`

## 文档索引

| 文档 | 说明 |
| --- | --- |
| [docs/PRD.md](docs/PRD.md) | 产品需求与里程碑规划 |
| [PROJECT.md](PROJECT.md) | 项目架构与交付规则 |
| [CHANGELOG.md](CHANGELOG.md) | 已完成变更记录 |
| [docs/auth-email-setup.md](docs/auth-email-setup.md) | Supabase 邮箱认证配置指南 |
| [docs/chrome-devtools-mcp.md](docs/chrome-devtools-mcp.md) | Chrome DevTools MCP 调试指南 |

## 图标资源说明

- 仓库根目录 `sandbox.png` 是 App 图标母版
- Web 图标位于 `public/`
- Android 图标位于 `android/app/src/main/res/mipmap-*`
- 替换图标时需同步更新以上所有位置
