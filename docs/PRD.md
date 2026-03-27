# AI Web Builder Mobile - 产品需求文档

## 产品概述

面向个人开发者、独立开发者、AI 爱好者和轻量网页需求用户，提供一个"在移动端通过自然语言生成网页项目"的 AI-native 安卓应用。用对话代替手工搭建页面，用项目代替一次性回答，用移动端降低创作门槛。

## 目标用户

- 个人开发者
- 独立开发者
- AI 爱好者
- 轻量网页需求用户

## 核心功能

- 用户通过 LLM 对话生成网页项目
- 项目管理：查看、新建、重命名、删除、继续编辑
- App 内 WebView 预览生成页面
- 项目/配置/历史与账号绑定
- 系统默认模型 + 用户自定义模型接入
- 安卓 App 形态交付

## MVP 范围（Phase 1）

- 登录：移动端优先邮箱认证，支持注册、密码登录、验证码登录与密码找回
- 生成：单页网页项目（本地结构化 mock generator）
- 管理：项目列表、详情、编辑、删除
- 预览：WebView 渲染 HTML/CSS/JS
- 存储：本地缓存为主，Supabase 预留接口
- 配置：基础模型配置 + 云端接入字段（本地保存）

## 范围外事项

- 真实邮箱/微信登录认证（Phase 2）
- 多模型切换（Phase 2）
- 多页面项目支持（Phase 3）
- 协作与分享社区（Phase 3）
- 资源上传（Phase 3）

## 技术约束

- React 19 + Vite 7 + TypeScript 5.9
- Tailwind CSS 4.x + Motion (Framer Motion v12+)
- Zustand 5（本地状态）+ TanStack Query 5（服务端状态，预留）
- React Router 7
- Capacitor 8（Android）
- Supabase JS v2 + Edge Functions（预留）
- pnpm 包管理

## 用户路径

1. 登录应用
2. 进入项目列表页
3. 新建项目并输入需求
4. 系统调用 LLM 生成网页文件
5. 用户在编辑页继续追问或微调
6. 用户在预览页查看渲染效果
7. 保存项目，后续继续编辑或分享

## 页面设计

- **登录页**：移动端分步式邮箱认证，支持注册、验证码登录、密码登录、密码找回
- **首页**：项目卡片列表、最近编辑排序、状态标签、搜索筛选、新建入口
- **编辑页**：全屏聊天布局（气泡对话 + 底部输入 + 思维链展示 + 模板卡片）
- **预览页**：WebView 渲染 + 代码/预览模式切换
- **设置页**：主题切换、模型偏好、API 配置

## 数据模型

核心表（当前本地 mock，预留云端映射）：

- `profiles`：用户信息
- `projects`：项目列表（含版本指针和状态）
- `project_versions`：版本快照（files jsonb）
- `project_messages`：会话消息历史
- `user_settings`：用户级配置（主题、模型、加密 API Key）

## 迭代路线

### Phase 1：MVP
- 登录入口（mock）、项目 CRUD、本地 mock AI 生成、WebView 预览、本地缓存

### Phase 2：增强版
- 真实邮箱/微信登录、多模型切换、版本回滚、分享链接、模板库

### Phase 3：进阶版
- 多页面项目、资源上传、思维链可视化、自修复生成、协作社区

## 安全设计

- API Key 不明文存储，优先服务端代理
- WebView 域名白名单 + 禁止外部跳转 + 安全策略注入
- 数据按 user_id 隔离（预留 RLS）
- 增量生成 + Token 统计 + 限流
## 2026-03-26 Auth Scope Update

- 当前邮箱认证已升级为移动端优先的分步式体验：注册先验证邮箱，再设置密码。
- 日常登录支持“验证码登录 / 密码登录”双模式，不默认强制双因子。
- 客户端默认保留 7 天登录态，超过 7 天必须重新登录。
- 用户与项目数据已建立明确归属边界，为后续 Supabase 表配置和 RLS 迁移做准备。
- 微信登录不在本次变更范围内，产品描述和 UI 不应再暗示“已支持真实微信登录”。
- 免费优先部署要求与 SMTP 建议见 `docs/auth-email-setup.md`。
## 2026-03-27 Project Persistence Update

- Authenticated project records now run through a Supabase-backed project service boundary instead of treating local storage as the source of truth.
- Home, Editor, and Preview load project data asynchronously from the remote-backed service and explicitly handle loading, empty, missing, and error states.
- Legacy local projects are migrated once per authenticated user, and local project storage is now cache plus migration material only.
- AI generation remains on the existing mock service in this milestone; replacing `mockAIService` stays in a separate backlog item.

## 2026-03-27 AI Boundary Update

- Project creation and continuation now use a settings-driven OpenAI-compatible AI boundary instead of a bundled runtime mock.
- AI generation fails closed when the model name, Base URL, API key, or returned file payload is invalid.
- The settings page now exposes explicit local AI configuration fields for model, Base URL, and API key.
