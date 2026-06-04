# 财搭子 Skills

面向通用 AI Agent 的财搭子公开 skills。MCP server 已发布为 npm 包，用户不需要从这个 repo 安装 MCP。

- 这个 repo：提供 `caidazi-*` skills、`manifest.yaml` 和安装引导。
- `@caidazi/mcp`：通过 npm 安装，负责用标准 stdio MCP 暴露财搭子工具。
- `caidazi-*` skills：告诉 Agent 什么时候调用工具、如何处理 API Key、结果如何组织。
- 投资逻辑、行情数据、打分规则和账户访问都留在财搭子后端。

统一使用 `CAIDAZI_API_KEY`。

## 快速安装

把下面这段发给你的 Agent：

```text
请帮我安装财搭子 Skills 和 MCP。

仓库：https://github.com/caidazi/dafa-skills

请以 manifest.yaml 为安装真源：
1. 从这个 repo 安装 caidazi-* skills。
2. 不要从这个 repo 运行 MCP server；MCP 通过 npm 包 @caidazi/mcp 安装。
3. 配置 caidazi MCP，使用 stdio：
  command: npx
  args: -y @caidazi/mcp

请用当前 Agent 支持的安全 secret/env 方式设置 CAIDAZI_API_KEY。
不要打印、回显或写入仓库。

当前先使用测试环境：
  CAIDAZI_BASE_URL=http://101.126.22.17:5011
  CAIDAZI_ALLOW_HTTP=true

安装后请验证 MCP tools/list 能看到 manifest.yaml 里的 public_tools。
smoke test 只能调用 smoke_safe_tools；除非我明确询问个人资产，不要读取我的自选、持仓或组合。
```

## MCP 通过 npm 配置

不同 Agent 的 MCP 配置文件位置不同，请使用该 Agent 官方支持的配置方式。通用形状如下：

```json
{
  "mcpServers": {
    "caidazi": {
      "command": "npx",
      "args": ["-y", "@caidazi/mcp"],
      "env": {
        "CAIDAZI_API_KEY": "<通过 secret/env 安全注入>",
        "CAIDAZI_BASE_URL": "http://101.126.22.17:5011",
        "CAIDAZI_ALLOW_HTTP": "true"
      }
    }
  }
}
```

`CAIDAZI_ALLOW_HTTP=true` 只用于当前可信测试后端。后端切到 HTTPS 后应移除。

## 验证

```bash
npx -y @caidazi/mcp --help
CAIDAZI_API_KEY=<redacted> CAIDAZI_BASE_URL=http://101.126.22.17:5011 CAIDAZI_ALLOW_HTTP=true npx -y @caidazi/mcp validate
```

预期结果：bridge 能连到测试后端，并列出财搭子公开工具。

本地开发验证：

```bash
npm install
npm test
CAIDAZI_API_KEY=<redacted> CAIDAZI_BASE_URL=http://101.126.22.17:5011 CAIDAZI_ALLOW_HTTP=true npm run validate
```

## API Key

在财搭子 App 中领取：

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。

不要把完整 API Key 粘贴到聊天、日志、截图、issue、PR 或项目文件里。

## 能做什么

公开能力：

- 市场脉搏：热点、大盘走势、板块变化和市场摘要。
- 单标的研究：股票、ETF、基金、指数的快速研究。
- 多标的比较：比较多个股票、ETF、基金或指数。
- 自然语言选股：用自然语言筛选候选股票或 ETF。
- 财经搜索：搜索资讯、公告、研报、政策和事件进展。
- 基金/ETF 研究：ETF 持仓、指数相关 ETF、基金和 ETF 对比。
- 宏观研究：政策、利率、通胀、汇率和大类资产影响。

账户能力需要 API Key 已绑定财搭子账户，并且只在用户明确询问个人资产时使用：

- 自选、持仓和组合快照。
- 轻量组合复盘。

## 安全边界

- 不暴露 API Key、内部表名、后端原始提示词或打分规则。
- 不从这个 repo 直接运行 MCP；MCP server 的用户安装入口是 npm 包 `@caidazi/mcp`。
- 不把测试 REST 后端当成 Agent-facing MCP endpoint；Agent-facing MCP 是 `@caidazi/mcp` stdio。
- 不编造行情、公告、研报、宏观数据或用户资产。
- 不把结果表述为收益承诺或确定性买卖建议。
- 安装 smoke test 不读取自选、持仓或组合。

## English Note

Caidazi skills are installed from this repo. Caidazi MCP is installed from npm with `npx -y @caidazi/mcp`. For the current test backend, set `CAIDAZI_BASE_URL=http://101.126.22.17:5011` and `CAIDAZI_ALLOW_HTTP=true`. Keep `CAIDAZI_API_KEY` in your Agent's secure secret/env flow.
