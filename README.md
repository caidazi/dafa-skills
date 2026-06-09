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
3. 用当前 Agent 官方 MCP 安装入口注册 caidazi MCP；不要猜配置文件路径，不要把 mcpServers 写进普通 settings.json。
  server name: caidazi
  transport: stdio
  command: npx
  args: -y @caidazi/mcp@latest

请用当前 Agent 支持的安全 secret/env 方式设置 CAIDAZI_API_KEY。
不要打印、回显或写入仓库。

当前先使用测试环境：
  CAIDAZI_BASE_URL=http://101.126.22.17:5011
  CAIDAZI_ALLOW_HTTP=true

安装后请验证当前 Agent 的 MCP tools/list、/mcp 面板或等价工具面板能看到 caidazi，并能直接看到 get_real_time_record。
只安装 skills、只写入 settings/env、或只让 skill 文本里提到工具名，都不算安装成功。
smoke test 只能调用 smoke_safe_tools；account_tools 只做发现验证。除非我明确询问个人资产，不要读取我的自选、持仓或组合。
安装后请尽量在当前 session 完成激活：如果当前 Agent 支持 MCP/skills/plugin reload 或 refresh，先执行官方刷新；再通过 tools/list 确认能看到 get_real_time_record；然后直接调用 get_real_time_record 完成最小查询：贵州茅台现在多少钱？
如果刷新后当前 session 仍看不到 caidazi 工具，请明确告诉我需要新建 session，并在新 session 用同一个最小查询验证。
回答用户问题时，直接使用已配置的 caidazi MCP tools；不要为普通查询临时启动 @caidazi/mcp、手写 JSON-RPC，或把 API Key 放进命令、日志、临时文件。
```

## MCP 通过 npm 安装

`@caidazi/mcp` 是标准 stdio MCP server。npm 只负责提供这个 server，真正让工具进入对话工具列表，必须通过当前 Agent 官方支持的 MCP 安装入口完成。

通用 server spec：

```text
name: caidazi
transport: stdio
command: npx
args: -y @caidazi/mcp@latest
env:
  CAIDAZI_API_KEY=<通过当前 Agent 的 secret/env 安全注入>
  CAIDAZI_BASE_URL=http://101.126.22.17:5011
  CAIDAZI_ALLOW_HTTP=true
```

`CAIDAZI_ALLOW_HTTP=true` 只用于当前可信测试后端。后端切到 HTTPS 后应移除。

如果当前 Agent 有官方 CLI，请优先让 Agent 使用 CLI 注册，而不是手写配置文件。例如：

```text
# Claude Code
claude mcp add --scope user caidazi \
  -e CAIDAZI_API_KEY=<你的 key> \
  -e CAIDAZI_BASE_URL=http://101.126.22.17:5011 \
  -e CAIDAZI_ALLOW_HTTP=true \
  -- npx -y @caidazi/mcp@latest

# Codex CLI
codex mcp add caidazi \
  --env CAIDAZI_API_KEY=<你的 key> \
  --env CAIDAZI_BASE_URL=http://101.126.22.17:5011 \
  --env CAIDAZI_ALLOW_HTTP=true \
  -- npx -y @caidazi/mcp@latest
```

只有当当前 Agent 官方文档明确要求编辑 `mcp.json`、`.mcp.json` 或等价 MCP 配置文件时，才把上面的 server spec 转成 JSON。不要把 `mcpServers` 写进普通 `settings.json` 充当安装完成。

## 验证

Agent 侧验证：

1. 通过当前 Agent 的 MCP tools/list 或工具面板确认 `caidazi` 已连接。
2. 确认能直接看到 `get_real_time_record`、`compare_assets` 等 MCP tools；不是只在 skill 文本里看到这些名字。
3. smoke test 只调用 `smoke_safe_tools`，不要读取自选、持仓或组合。
4. 如果 MCP 未连接，先修 MCP 配置；不要为回答某个问题临时拼命令或手写 JSON-RPC。
5. 如果 tools/list 看不到 `caidazi`，安装失败；不要回退成“通过 skill 调用 MCP”。

## 安装后的激活

不同 Agent 对“当前 session 是否能立刻发现新 MCP/skill”的支持不一致。安装 Agent 应按这个顺序处理：

1. 先使用当前 Agent 官方的 reload、refresh 或插件刷新能力。
2. 刷新后重新检查 MCP tools/list 或工具面板。
3. 如果已经能看到 `get_real_time_record`，直接调用这个 MCP 工具完成最小查询：`贵州茅台现在多少钱？`
4. 如果当前 session 仍看不到 `caidazi` 工具，再请用户新建 session 或重启当前 Agent。

无论当前 session 是否支持热刷新，都不要用 bash、npx 临时进程或手写 JSON-RPC 代替正常 MCP 工具调用。

维护者本地开发验证：

```text
npm install
npm test
npm run validate
```

运行 `npm run validate` 前，请用本机安全环境或 CI secret 设置 `CAIDAZI_API_KEY`。当前测试后端还需要设置 `CAIDAZI_BASE_URL=http://101.126.22.17:5011` 和 `CAIDAZI_ALLOW_HTTP=true`。

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
- 实时行情：简单查询最新价格、涨跌幅、成交量/额时直接使用 MCP 工具 `get_real_time_record`。
- 单标的研究：股票、ETF、基金、指数的核心矛盾和深度研究。
- 四维资产分析：资金面、技术面、财务面和估值面。
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

Caidazi skills are installed from this repo. Caidazi MCP is configured from the npm package `@caidazi/mcp` as a stdio MCP server through the current Agent's official MCP install flow, not by guessing a generic settings file. For the current test backend, set `CAIDAZI_BASE_URL=http://101.126.22.17:5011` and `CAIDAZI_ALLOW_HTTP=true`. Keep `CAIDAZI_API_KEY` in your Agent's secure secret/env flow.
