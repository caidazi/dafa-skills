# 财搭子外部 Skills

这个仓库是面向 Claude Code、Claude Desktop、Codex、OpenClaw、Cursor 等通用 AI Agent 的公开 skill 包。

这些 skill 刻意保持轻量：只告诉 Agent 什么时候调用财搭子 MCP、遇到 API Key 或工具不可用问题怎么恢复、结果应该如何组织。投资逻辑、数据拼接、候选生成、打分和私有账户访问都留在服务端 MCP wrapper 内部。

统一使用 `CAIDAZI_API_KEY` 作为环境变量。客户端可以为了兼容识别 `CAIZI_API_KEY`，但新增文档和提示词都应优先使用 `CAIDAZI_API_KEY`。

## 获取 API Key

使用这些 skill 前，需要先在财搭子 App 中领取 API Key。

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。
5. 在启动你的 AI Agent 前，把这个 key 设置为 `CAIDAZI_API_KEY`。

请保护好 API Key。不要把完整 key 粘贴到聊天、日志或公开文件里。

## 安装方式

不需要脚本。根据你使用的 AI Agent，复制对应段落直接发送给它。

### Claude Code CLI

复制以下内容发给 Claude Code：

```text
请为我安装财搭子（Caidazi）skills 和 MCP。

数据源
- Repo: https://github.com/caidazi/dafa-skills.git
- MCP Endpoint: http://101.126.22.17:5011/mcp
- MCP Auth: Bearer $CAIDAZI_API_KEY

安装要求
1. 拉取仓库到临时目录，读取 manifest.yaml 获取 skill 列表。
2. 安装 Skills 到 Claude Code 的正确 skills 目录：
   - 每个 skill 为独立子目录
   - 保留 SKILL.md 的完整 frontmatter（name、description 等），严禁删除
   - 如支持 user-invocable，评估是否添加该标记
3. 配置 MCP Server：
   - 执行：claude mcp add --transport http caidazi http://101.126.22.17:5011/mcp --header "Authorization: Bearer $CAIDAZI_API_KEY"
   - Claude Code CLI 原生支持 streamableHttp，不要通过 supergateway 等工具包装
4. 验证：执行 claude mcp list 确认 caidazi 已连接，并列出可用的财搭子 tools。
5. 报告安装路径、MCP 配置位置、调用方式。
```

### Claude Desktop (macOS/Windows App)

Claude Desktop 目前主要通过 MCP 扩展能力，自定义 skills 的文件系统支持有限。

在 Claude Desktop 的 **Settings → Developer → Edit Config** 中，添加以下 MCP 配置：

```json
{
  "mcpServers": {
    "caidazi": {
      "transport": "streamable-http",
      "url": "http://101.126.22.17:5011/mcp",
      "headers": {
        "Authorization": "Bearer <你的 CAIDAZI_API_KEY>"
      }
    }
  }
}
```

保存后重启 Claude Desktop，在侧边栏的 MCP 工具列表中确认 `caidazi` 已加载。

### Cursor

在 Cursor 的 **Settings → MCP** 中添加 server：

- **Name**: `caidazi`
- **Transport**: `Streamable HTTP`（或 HTTP/SSE，视 Cursor 版本而定）
- **URL**: `http://101.126.22.17:5011/mcp`
- **Headers**: `Authorization: Bearer <你的 CAIDAZI_API_KEY>`

如果 Cursor 支持项目级 `.cursor/mcp.json`，也可以写入该文件。配置完成后在 Composer 中确认 tools 可用。

### 其他 Agent（Codex、OpenClaw 等）

复制以下内容发送给你的 Agent：

```text
请为我安装财搭子（Caidazi）skills 和 MCP。

数据源
- Repo: https://github.com/caidazi/dafa-skills.git
- MCP Endpoint: http://101.126.22.17:5011/mcp
- MCP Auth: Bearer $CAIDAZI_API_KEY

安装要求
1. 拉取仓库到临时目录，读取 manifest.yaml 获取 skill 列表。
2. 安装 Skills 到你所在环境的正确 skills 目录：
   - 每个 skill 为独立子目录
   - 保留 SKILL.md 的完整 frontmatter（name、description 等），严禁删除
   - 如支持 user-invocable，评估是否添加该标记
3. 配置 MCP Server：
   - Name: caidazi
   - Transport: streamableHttp
   - URL: http://101.126.22.17:5011/mcp
   - Headers: Authorization: Bearer $CAIDAZI_API_KEY
   - 优先使用环境原生的 streamableHttp 支持，不要额外包装
4. 验证：确认 skills 可被索引，MCP tools 可被调用。
5. 报告安装路径、MCP 配置位置、调用方式。
```

## 已交付能力

| Skill | 用途 |
|---|---|
| `caidazi-market-pulse` | 市场热点、大盘走势、板块概览 |
| `caidazi-asset-research` | 单标的研究、多标的比较 |
| `caidazi-stock-screener` | 自然语言选股 |
| `caidazi-user-assets` | 财搭子自选与持仓查询 |
| `caidazi-finance-search` | 资讯、公告、研报、政策检索 |
| `caidazi-fund-etf-research` | 基金与 ETF 研究 |
| `caidazi-macro-research` | 宏观与大类资产分析 |
| `caidazi-portfolio-review` | 轻量组合复盘 |

公开 skill 不得包含内部表名、原始查询指令、内部账户工具名或具体打分规则。
