# AI Web Builder Mobile

## 项目概览

AI 原生移动端网页生成器。用户通过自然语言在 App 内创建、演化、预览并管理网页项目。当前处于 MVP 阶段，认证、云端数据和真实 AI 能力仍以 mock 边界预留接入位。

## 产品定位

- 面向个人开发者、独立开发者和轻量网页需求用户
- 以对话驱动网页生成与项目迭代
- 以移动端体验为主入口，兼顾后续真实后端与 AI 接入

## 技术栈

- React 19
- TypeScript 5.9
- Vite 7
- Tailwind CSS 4
- Motion
- React Router 7
- Zustand 5
- Capacitor 8 Android
- highlight.js
- Sonner
- pnpm

## 建议目录结构

```text
src/
  App.tsx
  main.tsx
  router.tsx
  components/ui/
  pages/
    home/
    login/
    editor/
    preview/
    settings/
  services/
    auth/
    ai/
    project/
    settings/
  stores/
  features/
  lib/
  styles/
  types/
android/
docs/
openspec/
  changes/
  specs/
.claude/
TASK.json
CHANGELOG.md
PROJECT.md
```

## 页面与路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/login` | 登录页 | 当前仅支持邮箱认证入口 |
| `/` | 首页 | 项目列表、搜索、状态筛选、快速创建 |
| `/editor/:projectId?` | 编辑页 | 对话驱动的项目创建与继续生成 |
| `/preview/:projectId` | 预览页 | 预览模式与代码模式切换 |
| `/settings` | 设置页 | 主题与模型相关配置 |

## 本地开发与构建命令

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`
- Web 构建：`pnpm build`
- Android 同步：`pnpm android:sync`
- 打开 Android 工程：`pnpm android:open`
- 构建 Debug APK：`pnpm android:apk:debug`

## 环境与外部依赖

- Node.js 24 LTS
- pnpm 10+
- JDK，并正确设置 `JAVA_HOME`
- Android SDK / Android Studio

## 当前接入边界

| 模块 | 当前状态 | 未来真实接入位 |
|---|---|---|
| 登录 | Supabase 邮箱认证 | `src/services/auth` 扩展密码、验证码、找回密码 |
| 项目数据 | 本地存储为主 | `src/services/project` 接云端持久化 |
| AI 生成 | 结构化 mock generator | `src/services/ai` 接真实模型代理 |
| 版本历史 | 本地快照 | 云端版本管理 |
| 设置 | 本地保存 | 云端用户设置 |

## 完整项目工作流

### Phase 1: Definition

目标：把需求变成可执行 change。

顺序：

1. 需求接收
2. 调研代码与约束
3. 形成设计方案
4. 设计评审
5. 任务拆解与 acceptance criteria

输出：

- `proposal.md`
- `design.md`
- `tasks.md`
- `TASK.json`

### Phase 2: Delivery

目标：按 task 实现，并通过评审与验证证明实现正确。

顺序：

1. 开发实现
2. task 执行与 history 记录
3. 实现评审
4. 功能测试
5. Playwright UI 自动化测试（user-facing）
6. build / compile 验证
7. 文档同步
8. task 独立 commit

### Phase 3: Closure

目标：将 change 变成正式完成状态。

顺序：

1. 汇总变更说明
2. changelog 更新
3. change 级收口检查
4. archive

## 双 Review 规则

### 设计评审

- 发生在开发前
- 检查需求、范围、风险、方案与 task 拆解
- 未通过不得进入 Delivery

### 实现评审

- 发生在开发后
- 检查实现是否符合 design、是否存在偏差与回归风险
- 同时检查 task history、验证证据和 task 级 commit 追溯是否完整
- 未通过不得进入 Closure

## Task 交付规则

- 所有开发工作以 task 为闭环单位，不以 change 的“代码已写完”作为完成标准。
- 每个 task 必须先登记到 `TASK.json`，并关联 OpenSpec change。
- 每个 task 必须维护 `openspec/changes/<change>/logs/<task-id>.jsonl` 追加式历史。
- 每个交付型 task 必须在 `TASK.json` 中声明 `commitRequired: true`。
- 每个交付型 task 完成后必须立即独立 commit，一项功能点对应一个 commit。
- commit message 必须包含 task 标识，例如 `feat: TASK-010 完成邮箱验证码登录`。
- `TASK.json` 必须记录 `commitRef` 与 `commitMessage`，task history 必须记录提交事件。
- 未满足必需门禁或未记录提交证据的 task 不得标记为 `done`。

## 必需门禁

- 功能改动需要功能测试验证
- user-facing 改动需要 Playwright 自动化 UI 测试
- 需要构建验证的 task 必须通过 build 或 compile 检查
- 文档改动必须同步 `PROJECT.md`、`CHANGELOG.md`、相关 OpenSpec 工件
- `commitRequired = true` 的 task 必须先进入 `committed`，再进入 `done`
- change archive 之前，双 review 必须都已完成

## 临时测试产物

- agent 为当前 task 动态生成的测试文件、报告、截图、trace 和临时目录都属于一次性验证产物。
- 这些产物在结果写入 task history 后必须删除。
- 默认不保留临时测试文件，避免增加仓库噪音与后续上下文负担。
- 只有显式声明为长期回归资产的测试才允许保留。
- 已记录结果但未清理临时测试产物的 task 不得进入 `done`。

## 提交与推送规则

- 使用中文 Conventional Commits：`feat:`、`fix:`、`refactor:`、`docs:`、`test:`、`chore:`
- 禁止把多个无关 task 合并成一个提交
- 禁止在 task 尚未完成全部必需门禁前提前提交“已完成”性质的收口记录
- 不得伪造 push 成功；没有 remote 或 upstream 时必须明确说明阻塞
- 禁止 `git push --force` 到主分支

## 文档同步规则

- 项目结构、命令、工作流变化时同步维护 `PROJECT.md`
- 产品范围或需求变化时同步维护 `docs/PRD.md`
- 只有完成并验证通过的变更才能写入 `CHANGELOG.md`
- OpenSpec 的 proposal、design、tasks、spec 与 `TASK.json` 必须保持一致

## 2026-03-26 邮箱认证更新

- 登录方式已切换为 `Supabase Auth` 邮箱验证码 / OTP 优先方案，并保留 `/login` 回调恢复能力。
- 登录页不再展示“微信已可用”的误导入口，当前版本明确仅支持邮箱登录。
- 认证配置需要通过 `.env` 注入 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_SUPABASE_EMAIL_REDIRECT_TO`。
- 免费优先 SMTP 接入说明见 `docs/auth-email-setup.md`，推荐使用 `Resend Free` 作为 Supabase 自定义 SMTP。
