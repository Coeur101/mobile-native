# Changelog

## 2026-03-25

- `feat`: 新增结构化项目模型、mock 认证服务、mock AI 服务、mock 项目服务和用户设置服务。
- `feat`: 新增登录页、项目列表页、编辑页、预览页、设置页，并将编辑页升级为对话/文件/预览/历史四个 Tab。
- `feat`: 初始化 Capacitor Android 工程并完成 `cap sync android`，预留后续 deep link 与真实认证回调入口。
- `refactor`: 将原型式 `code` 数据升级为 `files / messages / versions` 结构，并增加旧数据迁移逻辑。
- `docs`: 更新 `方案.md`、`README.md`、`AGENTS.md`，并新增 `todolist.json` 记录实施步骤。
- `fix`: 清理旧样式依赖残留，修复构建过程中 `tw-animate-css` 缺失导致的失败。
