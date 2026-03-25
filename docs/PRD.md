# AI Web Builder Mobile — 产品需求文档 (PRD)

> 版本：1.0
> 日期：2026-03-25
> 状态：基于前端 Mock 原型提炼

---

## 1. 产品概述

### 1.1 产品定位

AI Web Builder Mobile 是一款移动端 AI 网页生成器。用户通过自然语言描述需求，AI 自动生成可运行的网页项目（HTML + CSS + JS），支持多轮对话迭代、实时预览、版本管理和代码导出。

### 1.2 目标用户

| 用户类型 | 描述 |
|---------|------|
| 非技术用户 | 希望零代码快速搭建个人网页、落地页、工具页 |
| 初级开发者 | 用 AI 辅助生成代码骨架，再手动调整 |
| 产品/设计人员 | 快速制作交互原型，验证想法 |

### 1.3 核心价值

- 对话即创建：用自然语言描述，AI 生成完整网页
- 多轮迭代：基于已有项目持续优化，每次对话产出新版本
- 即时预览：生成结果可直接在 App 内预览和导出
- 移动优先：随时随地在手机上创建网页项目

---

## 2. 功能模块

### 2.1 用户认证模块

#### 2.1.1 邮箱登录

| 属性 | 描述 |
|------|------|
| 入口 | 登录页邮箱输入框 + 登录按钮 |
| 输入 | 邮箱地址（必填） |
| 行为 | 发送验证码/魔法链接 → 验证通过 → 创建会话 → 跳转首页 |
| 数据 | 生成 UserProfile：id、email、nickname、provider="email" |

#### 2.1.2 微信登录

| 属性 | 描述 |
|------|------|
| 入口 | 登录页微信登录按钮 |
| 行为 | 拉起微信授权 → 获取 openid/unionid → 创建/绑定账户 → 跳转首页 |
| 数据 | 生成 UserProfile：id、nickname（微信昵称）、provider="wechat" |

#### 2.1.3 会话管理

- 登录状态持久化（token 存储）
- 路由守卫：未登录用户自动跳转登录页
- 退出登录：清除会话 → 跳转登录页

#### 2.1.4 数据模型

```typescript
type AuthProvider = "email" | "wechat"

interface UserProfile {
  id: string
  email?: string
  nickname: string
  provider: AuthProvider
}
```

---

### 2.2 项目管理模块

#### 2.2.1 项目列表（首页）

| 功能 | 描述 |
|------|------|
| 列表展示 | 按更新时间倒序展示所有项目卡片 |
| 卡片信息 | 项目名称、描述摘要、对话消息数、版本数、最后更新时间 |
| 操作 | 编辑（进入编辑页）、预览（进入预览页）、删除（二次确认后删除） |
| 空状态 | 无项目时显示欢迎引导 + 新建入口 |
| 新建入口 | 浮动按钮（FAB），点击进入空白编辑页 |

#### 2.2.2 项目创建

| 属性 | 描述 |
|------|------|
| 触发 | 用户在编辑页发送第一条消息 |
| 流程 | 用户输入提示词 → AI 生成项目文件 + 思维链 → 创建项目记录 → 保存初始版本快照 |
| 输出 | Project 对象（含 files、messages、versions） |

#### 2.2.3 项目迭代

| 属性 | 描述 |
|------|------|
| 触发 | 用户在已有项目的编辑页发送新消息 |
| 流程 | 追加用户消息 → AI 基于现有项目 + 新需求生成更新 → 更新文件 → 自动创建新版本快照 |
| 特点 | 保留完整对话历史，支持上下文连续对话 |

#### 2.2.4 版本管理

| 功能 | 描述 |
|------|------|
| 自动快照 | 每次 AI 生成/更新时自动创建版本 |
| 手动快照 | 用户可在编辑页手动保存当前版本 |
| 版本信息 | 版本号（递增）、摘要、文件快照、创建时间 |

#### 2.2.5 数据模型

```typescript
type ProjectStatus = "draft" | "active" | "archived"
type ProjectFileMap = Record<string, string>

interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  files: ProjectFileMap          // 当前文件内容
  messages: ProjectMessage[]     // 对话历史
  versions: ProjectVersion[]     // 版本快照列表
  preview: ProjectMeta           // 预览元信息
  createdAt: string              // ISO 8601
  updatedAt: string              // ISO 8601
}

interface ProjectVersion {
  id: string
  versionNo: number
  summary: string
  files: ProjectFileMap
  createdAt: string
}

interface ProjectMeta {
  entry: string                  // 入口文件，默认 "index.html"
  framework: "vanilla"           // 后续可扩展
}
```

---

### 2.3 AI 对话编辑模块

#### 2.3.1 编辑页布局

| 区域 | 描述 |
|------|------|
| 顶栏 | 返回按钮、项目名称、描述（截断）、保存版本按钮、预览按钮 |
| 内容区 | 全屏聊天气泡布局（用户消息右对齐、AI 消息左对齐） |
| 底栏 | 多行输入框 + 发送按钮（吸底固定） |

#### 2.3.2 欢迎状态（无消息时）

| 功能 | 描述 |
|------|------|
| 引导文案 | "你想创造点什么？" |
| 模板卡片 | 展示 4 个预设模板，点击自动填充输入框 |

**预设模板：**

| 模板 | 标签 | 提示词内容 |
|------|------|-----------|
| todo | 待办清单 | 创建一个简洁美观的待办事项清单应用 |
| timer | 番茄钟 | 创建一个番茄工作法计时器 |
| landing | 产品落地页 | 创建一个现代风格的产品展示落地页 |
| weather | 天气卡片 | 创建一个天气信息展示卡片组件 |

#### 2.3.3 对话交互

| 功能 | 描述 |
|------|------|
| 发送消息 | Enter 发送，Shift+Enter 换行 |
| 用户消息 | 右对齐紫色气泡 + 用户头像 |
| AI 消息 | 左对齐边框气泡 + AI 头像 + 思维链展示 |
| 加载状态 | AI 生成中显示脉冲加载指示器，输入框禁用 |
| 自动滚动 | 新消息自动滚动到底部 |

#### 2.3.4 思维链展示

AI 回复包含可视化的推理过程，以垂直时间线形式展示：

| 步骤 | 标题 | 描述 |
|------|------|------|
| 1 | 理解需求 | 分析用户输入的自然语言需求 |
| 2 | 设计方案 | 确定页面结构、样式风格、交互方案 |
| 3 | 生成代码 | 生成 HTML/CSS/JS 代码文件 |
| 4 | 质量检查 | 检查代码规范、兼容性、可访问性 |
| 5 | 部署就绪 | 确认项目可预览和导出 |

每个步骤有 4 种状态：pending → loading → success / error

#### 2.3.5 消息数据模型

```typescript
interface ProjectMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinkingSteps?: ThinkingStep[]
  meta?: Record<string, string>  // 如 { provider: "mock-ai" }
  createdAt: string
}

type ThinkingStepStatus = "pending" | "loading" | "success" | "error"

interface ThinkingStep {
  id: string
  title: string
  description: string
  content?: string
  status: ThinkingStepStatus
}
```

---

### 2.4 项目预览模块

#### 2.4.1 预览模式

| 属性 | 描述 |
|------|------|
| 渲染方式 | iframe 沙箱渲染（sandbox="allow-scripts"） |
| 文件组装 | 将 index.html + style.css + main.js 合并为完整 HTML 文档 |
| 组装逻辑 | CSS 注入 `<head>` 的 `<style>` 标签，JS 注入 `</body>` 前的 `<script>` 标签 |

#### 2.4.2 代码模式

| 属性 | 描述 |
|------|------|
| 布局 | 按文件分区展示（index.html、style.css、main.js） |
| 样式 | 暗色背景 + 代码高亮，只读展示 |

#### 2.4.3 导出功能

| 属性 | 描述 |
|------|------|
| 格式 | 单文件 HTML（内联 CSS + JS） |
| 文件名 | `{项目名称}.html` |
| 触发 | 预览页导出按钮 |

#### 2.4.4 预览页布局

| 区域 | 描述 |
|------|------|
| 顶栏 | 返回按钮、项目名称、模式切换（预览/代码）、导出按钮 |
| 内容区 | 预览 iframe 或 代码面板 |

---

### 2.5 用户设置模块

#### 2.5.1 主题设置

| 选项 | 描述 |
|------|------|
| 浅色 | 固定浅色主题 |
| 自动 | 跟随系统偏好（prefers-color-scheme） |
| 深色 | 固定深色主题 |

主题切换实时生效，通过 document root class 控制。

#### 2.5.2 AI 模型配置

| 字段 | 描述 |
|------|------|
| 首选模型 | AI 模型名称（预留） |
| 自定义 Base URL | API 端点地址（预留） |
| API Key | 密钥（密码输入框，预留） |

#### 2.5.3 备注

| 字段 | 描述 |
|------|------|
| 备注 | 多行文本，用户自由记录 |

#### 2.5.4 数据模型

```typescript
interface UserSettings {
  theme: "light" | "dark" | "auto"
  preferredModel: string
  customBaseUrl: string
  apiKey: string
  notes: string
}
```

---

## 3. 页面路由

| 路由 | 页面 | 认证 | 描述 |
|------|------|------|------|
| `/login` | 登录页 | 否 | 邮箱 + 微信登录入口 |
| `/` | 首页 | 是 | 项目列表 + 新建入口 |
| `/editor/:projectId?` | 编辑页 | 是 | AI 对话式编辑，projectId 可选（新建时无） |
| `/preview/:projectId` | 预览页 | 是 | 预览/代码双模式 + 导出 |
| `/settings` | 设置页 | 是 | 主题 + 模型配置 + 退出登录 |

---

## 4. 技术架构

### 4.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 7 | 构建工具 |
| Tailwind CSS | v4 | 样式系统 |
| Motion | v12+ | 动画（Framer Motion） |
| Zustand | — | 轻量状态管理 |
| React Router | 7 | 路由 |
| Capacitor | 8 | Android 原生容器 |

### 4.2 数据存储（当前 Mock → 后续真实）

| 数据 | Mock 实现 | 真实实现（计划） |
|------|----------|----------------|
| 用户认证 | localStorage 模拟 | Supabase Auth（邮箱 + 微信 OAuth） |
| 项目数据 | localStorage | Supabase Database |
| AI 生成 | 结构化 mock generator | Edge Function / AI 代理 |
| 用户设置 | localStorage | Supabase 用户级云端设置 |
| 版本历史 | localStorage 快照 | Supabase + 增量存储 |

### 4.3 localStorage 键名

| 键 | 内容 |
|----|------|
| `ai_web_builder_projects` | 项目数组 |
| `ai_web_builder_settings_v2` | 用户设置 |
| `ai_web_builder_auth_v2` | 用户信息 |
| `theme` | 主题模式 |

---

## 5. 交互设计规范

### 5.1 动画系统

| 动画类型 | 参数 | 用途 |
|---------|------|------|
| Apple 缓动 | cubic-bezier(0.32, 0.72, 0, 1) | 通用过渡 |
| 平滑入场 | cubic-bezier(0.22, 1, 0.36, 1) | 元素入场 |
| 按钮弹簧 | stiffness: 500, damping: 30 | 按钮按压 |
| 弹性弹簧 | stiffness: 300, damping: 22 | 浮动元素 |
| 页面转场 | 0.3s opacity 淡入 | 路由切换 |
| 按钮点按 | scale: 0.95 | 触觉反馈 |

### 5.2 主题色系

| 色系 | 描述 |
|------|------|
| 品牌色 | 紫色系 |
| 色调 | 温暖柔和（非冷灰 slate） |
| 暗色模式 | 通过 `.dark` class 切换，CSS 变量控制 |

### 5.3 通知提示

| 属性 | 描述 |
|------|------|
| 位置 | 底部居中，offset 80px |
| 原因 | 避免遮挡顶部导航栏，符合移动端操作习惯 |

---

## 6. AI 生成能力（核心功能规格）

### 6.1 输入

- 用户自然语言描述（中文/英文）
- 可选：已有项目上下文（用于迭代更新）

### 6.2 输出

```typescript
interface GeneratedProjectPayload {
  projectName: string              // 从提示词派生
  summary: string                  // 项目描述摘要
  files: ProjectFileMap            // 生成的文件内容
  messages: ProjectMessage[]       // 包含思维链的 AI 回复
  meta: ProjectMeta                // 预览元信息
}
```

### 6.3 生成文件结构

| 文件 | 内容 |
|------|------|
| index.html | HTML5 结构，含语义化标签、响应式 meta |
| style.css | 完整样式，含 glassmorphism、渐变、动画 |
| main.js | 交互逻辑 |

### 6.4 迭代能力

- 新建：根据提示词从零生成
- 更新：基于已有文件 + 新需求，增量更新（可继承已有样式）
- 项目名称：从提示词提取前 20 字符

---

## 7. 非功能需求

### 7.1 性能

| 指标 | 要求 |
|------|------|
| 首屏加载 | < 2s（移动网络） |
| AI 响应 | 生成过程中显示思维链进度，避免用户空等 |
| 动画帧率 | 60fps，使用 GPU 加速 |

### 7.2 兼容性

| 平台 | 要求 |
|------|------|
| Android | Capacitor 容器，最低 API 24 |
| Web | Chrome/Safari/Firefox 最新 2 个版本 |
| 响应式 | 移动端优先，兼容平板 |

### 7.3 安全

| 项目 | 要求 |
|------|------|
| 预览沙箱 | iframe sandbox="allow-scripts"（禁止 allow-same-origin） |
| API Key | 密码输入框，不明文展示 |
| 认证 | token 安全存储，路由守卫 |

### 7.4 数据迁移

- 支持旧数据格式自动迁移（legacy localStorage 结构 → 新结构）
- 迁移范围：项目数据、用户设置、认证信息

---

## 8. 用户旅程

```
┌─────────────────────────────────────────────────────┐
│                    启动 App                          │
│                      │                               │
│              已登录？─┤─ 否 ──→ 登录页               │
│                │      │         │                    │
│               是      │    邮箱/微信登录              │
│                │      │         │                    │
│                ▼      │         │                    │
│             首页 ◀────┘─────────┘                    │
│          （项目列表）                                 │
│         ┌────┼────┐                                  │
│         │    │    │                                   │
│       编辑  预览  设置                                │
│         │    │    │                                   │
│    ┌────┤    │    ├───→ 主题/模型/退出                │
│    │    │    │                                        │
│  新建  迭代  │                                       │
│    │    │    │                                        │
│    └──┬─┘    │                                       │
│       │      │                                       │
│   AI 生成    │                                       │
│   思维链展示  │                                       │
│       │      │                                       │
│       └──────┤                                       │
│              │                                       │
│         预览/代码                                     │
│         导出 HTML                                    │
└─────────────────────────────────────────────────────┘
```

---

## 9. 后续演进方向（基于 Mock 预留接口）

| 模块 | 当前状态 | 真实接入计划 |
|------|---------|-------------|
| `services/auth` | Mock 本地会话 | Supabase Auth + 微信 OAuth |
| `services/project` | localStorage | Supabase Database |
| `services/ai` | 结构化生成器 | Edge Function / LLM API |
| `services/settings` | localStorage | 云端用户设置 |
| Capacitor | 基础容器 | Deep link、认证回调、签名发布 |
| CI/CD | Debug APK | Release 签名包、AAB、自动发布 |

---

## 10. 验收标准

### 10.1 Mock 阶段验收（当前）

- [x] 邮箱/微信 Mock 登录正常，会话持久化
- [x] 项目 CRUD 全流程：创建、列表、编辑、删除
- [x] AI Mock 生成带思维链的项目文件
- [x] 多轮对话迭代，版本自动递增
- [x] 预览模式 iframe 正常渲染
- [x] 代码模式正确展示文件内容
- [x] HTML 导出功能正常
- [x] 主题切换（亮/暗/自动）实时生效
- [x] 路由守卫正常拦截未登录用户
- [x] Toast 通知不遮挡导航栏
- [x] 动画流畅无卡顿

### 10.2 真实接入阶段验收（后续）

- [ ] Supabase 认证替换 Mock，邮箱验证码 + 微信 OAuth 流程完整
- [ ] 项目数据云端持久化，多设备同步
- [ ] AI 真实生成代码，支持主流 LLM
- [ ] 设置云端同步
- [ ] Android 签名发布 + 应用商店上架
