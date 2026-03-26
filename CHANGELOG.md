# AI Web Builder Mobile CHANGELOG

## [Unreleased]

### Attempted

- （暂无）

### Completed

- （暂无）

### Reverted

- （暂无）

---

## 2026-03-25（MVP 前端对齐）

### Attempted

- 评估 shadcn/ui 组件库方案，最终移除 46+ 死代码组件，转为轻量自研 UI 组件

### Completed

- 新增 Dialog 通用对话框组件，支持确认/取消/危险操作样式
- 新增项目删除二次确认对话框，防止误删
- 新增 VersionPanel 版本历史侧滑面板，支持查看版本列表和恢复历史版本
- 新增 CodeBlock 代码高亮组件，集成 highlight.js，支持 HTML/CSS/JS 语法高亮和行号显示
- 新增自定义 highlight.js 暗色主题，适配项目紫色品牌色
- 新增首页项目搜索功能，支持按名称和描述模糊搜索
- 新增首页项目状态筛选标签（全部/草稿/进行中/已归档）
- 新增 Skeleton 骨架屏组件和项目列表骨架屏
- 新增全局 ErrorBoundary 错误边界组件，捕获运行时错误并提供重试按钮
- 新增编辑页项目名称点击编辑功能，支持重命名
- ProjectService 接口新增 restoreProjectVersion 和 updateProjectMeta 方法
- 新增 PRD 产品需求文档 docs/PRD.md
- 新增 motion (Framer Motion v12+) 动画库依赖
- 新增 ThemeProvider 主题系统：Zustand store + html class 切换，支持亮色/暗色/自动三种模式
- 新增 PageTransition 页面转场组件
- 新增 PulsingDots 脉冲加载指示器组件
- 新增 ThoughtChain 思维链组件：垂直时间线 + 4 种状态图标 + 可折叠内容
- 新增动画常量模块 src/lib/animations.ts
- ProjectMessage 类型扩展 thinkingSteps 字段，支持 AI 多步推理展示
- 重写 theme.css：冷灰 slate 色调替换为温暖柔和色调 + 紫色品牌色 + 暗色主题
- EditorPage 从分栏 Tabs 布局重构为全屏聊天布局
- 全部 5 个页面按钮改为纯图标，移除文字占用
- 动画优化：PageTransition 仅用 opacity 动画，移除 layout/stagger 重绘动画
- Input/Tabs 组件主题适配
- mock AI 服务生成带 5 步思维链的 AI 回复
- 整理项目目录结构：删除 src/app/ 下旧组件和冗余文件
- 设置页主题切换按钮添加中文文字标签
- 设置页保存按钮改为带"保存设置"文字的完整按钮
- index.html lang 属性从 "en" 改为 "zh-CN"
- 修复页面标题为 "Untitled"，改为 "AI Web Builder"，添加 SVG emoji favicon
- 修复项目名称中中文标点被替换为连字符的问题
- 修复首页空状态与项目列表同时显示的 AnimatePresence 动画竞态
- 修复预览页 iframe sandbox 安全警告
- Toast 通知从 top-center 改为 bottom-center + 80px offset

### Reverted

- （暂无）

## 2026-03-25（项目初始化）

### Attempted

- 评估 React Native + WebView 方案，最终选定 React + Capacitor 路线

### Completed

- 新增结构化项目模型、mock 认证/AI/项目/设置服务
- 新增登录页、项目列表页、编辑页、预览页、设置页
- 初始化 Capacitor Android 工程，完成 cap sync android
- GitHub Actions 自动构建 Debug APK 工作流
- 修复 android/gradlew 无执行权限导致 APK 构建失败
- 清理旧样式依赖残留，修复 tw-animate-css 缺失构建失败
- 切换构建工具到 pnpm
- 将原型式 code 数据升级为 files/messages/versions 结构，增加迁移逻辑
- 更新 README、AGENTS.md

### Reverted

- （暂无）
