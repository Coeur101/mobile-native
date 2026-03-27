# Chrome DevTools MCP

## 目的

为项目补充一套可视化浏览器验收与调试能力，和现有 Playwright 自动化回归形成互补：

- Playwright：负责闭环自动化测试、回归验证、临时脚本执行
- Chrome DevTools MCP：负责打开真实浏览器、检查 DOM / Network / Console、做交互验收和页面问题定位

## 当前接入位置

当前 Codex 实际生效的 MCP 配置位于：

- `C:\Users\Administrator\.codex\config.toml`

已新增：

- `mcp_servers.chrome-devtools`

## 服务配置

```toml
[mcp_servers.chrome-devtools]
type = "stdio"
command = "cmd"
args = [ "/c", "npx", "-y", "chrome-devtools-mcp@latest" ]
env = { SystemRoot = "C:\\Windows", PROGRAMFILES = "C:\\Program Files" }
startup_timeout_ms = 20000
```

## 使用约定

1. 需要做自动化回归时，继续优先使用 Playwright。
2. 需要人工可见验收、页面调试、布局排查、Console / Network 检查时，优先使用 Chrome DevTools MCP。
3. user-facing 改动仍然必须保留 Playwright UI 自动化验证，Chrome MCP 不能替代闭环自动化门禁。
4. 临时调试产物不进入仓库；记录结论后继续按现有清理规则删除一次性文件。

## 生效方式

修改 `config.toml` 后，需要重启 Codex 会话，新的 MCP 工具才会出现在工具列表中。
