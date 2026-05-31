# 财搭子外部 Skills

面向 Claude Code、Claude Desktop、Codex、OpenClaw、Cursor 等通用 AI Agent 的公开 skill 包。

这些 skill 只负责告诉 Agent 什么时候调用财搭子 MCP、如何处理 API Key/工具不可用、结果如何组织。投资逻辑、数据拼接、候选生成、打分和私有账户访问都留在服务端 MCP wrapper 内部。

统一使用 `CAIDAZI_API_KEY`。

## Agent 安装契约

如果你是正在安装本仓库的 AI Agent，请以 `manifest.yaml` 为真源，不要写死某个客户端的旧配置路径。

1. 拉取 `https://github.com/caidazi/dafa-skills.git`，读取 `manifest.yaml`。
2. 安装 `skills.included` 中的 skill 目录；如果当前 Agent 不支持 skills，进入 MCP-only 模式并说明限制。
3. 配置 MCP：
   - name: `mcp.server_name`
   - transport: 当前 Agent 对 Streamable HTTP 的等价写法
   - endpoint: 优先使用 `mcp.production_endpoint` / `mcp.endpoint`
   - auth: `Authorization: Bearer {CAIDAZI_API_KEY}`，key 必须来自 secret/env 引用
4. 处理 API Key：
   - 不要生成 key，不要要求用户把完整 key 发到聊天里。
   - 不要通过 `printenv`、`echo`、日志、截图或最终报告回显完整 key。
   - 不要把 key 写入仓库、README、issue、PR 或普通项目配置文件。
   - 如果缺 key，引导用户到财搭子 App 领取，并用 secret store、MCP 配置 UI、本机环境变量或交互式 secret 输入设置。
5. 处理 endpoint 安全：
   - 如果 HTTPS endpoint 仍是占位符，暂停并要求用户或项目方提供官方 HTTPS endpoint。
   - 不要自动降级到 `mcp.test_endpoint`。
   - 不要在公网向 HTTP endpoint 发送 Bearer key；只有用户明确确认可信测试环境时才可使用 HTTP 测试端点。
6. 验证：
   - 先做本地验证：manifest 可解析、skills 已索引或 MCP-only、MCP 配置已写入或生成草案。
   - 网络 smoke test 只能使用 `required_mcp.smoke_safe_tools`。
   - 禁止用自选、持仓、组合工具做安装验证；这些账户工具只在用户主动询问个人资产时使用。
7. 安装后向用户说明能做什么，区分公开能力和账户能力，并询问用户想先做哪类任务。

安装报告请保持简短，包含：skills 模式、MCP 配置状态、API Key 状态（不回显 key）、传输安全、公开工具可见性、smoke test 结果或跳过原因。

## 用户快速开始

复制下面这段发给你的 AI Agent：

```text
请为我安装财搭子（Caidazi）Skills 和 MCP。

Repo: https://github.com/caidazi/dafa-skills.git

请读取 README.md 和 manifest.yaml，以 manifest.yaml 为安装真源。

要求：
1. 安装 manifest.yaml 中列出的 skills；如果当前 Agent 不支持 skills，请进入 MCP-only 模式并说明限制。
2. 配置 caidazi MCP，endpoint、transport、auth 都从 manifest.yaml 读取。
3. 检查 CAIDAZI_API_KEY。
4. 如果没有 key，不要生成 key，不要让我把完整 key 发到聊天里。请告诉我到财搭子 App -> 大发 agent 页面 -> 左上角 skill icon -> Skills 页面领取，然后用当前 Agent 支持的安全方式设置为 CAIDAZI_API_KEY。
5. 如果 HTTPS endpoint 还是占位符，请先让我提供官方 HTTPS endpoint，不要自动改用 HTTP 测试端点。
6. 验证时只调用 smoke_safe_tools，不要调用我的自选、持仓或组合工具。
7. 安装完成后，请简短说明财搭子能做什么，并问我想先做哪类任务。
```

## API Key

在财搭子 App 中领取：

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。
5. 用安全方式设置为 `CAIDAZI_API_KEY`。

不要把完整 API Key 粘贴到聊天、日志或公开文件里。Agent 只能报告 key 是否存在、是否可用，不应回显完整 key。

## Endpoint 安全

`manifest.yaml` 当前默认使用 HTTPS 生产 endpoint 占位符，并保留一个 HTTP 测试端点。

正式公开发布前，必须把 `https://<caidazi-https-mcp-endpoint>/mcp` 替换为官方 HTTPS endpoint。HTTP 测试端点只能在用户明确确认可信测试环境时使用，不能作为默认带 key 连接目标。

## 能做什么

公开能力：

- 市场脉搏：热点、大盘走势、板块概览、盘前盘中盘后摘要。
- 单标的研究：股票、ETF、基金、指数的快速研究和原因分析。
- 多标的比较：比较多个股票、ETF、基金或指数。
- 自然语言选股：用自然语言筛选候选股票或 ETF。
- 财经搜索：搜索资讯、公告、研报、政策和事件进展。
- 基金/ETF 研究：查询 ETF 持仓、指数相关 ETF、基金和 ETF 对比。
- 宏观研究：分析政策、利率、通胀、汇率和大类资产影响。

账户能力需要 API Key 已绑定财搭子账户，且只能在用户主动询问个人资产时使用：

- 用户资产上下文：查询并使用财搭子自选、持仓和组合快照。
- 组合复盘：基于财搭子自选、持仓或组合快照做轻量复盘。

样例 query：

- 今天 A 股市场热点是什么？
- 帮我看下宁德时代最近的核心矛盾。
- 比亚迪和宁德时代谁更值得跟踪？
- 找出最近资金强、估值不贵的新能源股票。
- 纳指 ETF 和恒生科技 ETF 怎么选？
- 我的自选里今天哪些最值得关注？（会读取账户资产，需你主动发起）

## 边界

- 不要暴露 API Key、内部表名、原始查询指令、内部账户工具名或具体打分规则。
- 不要编造行情、公告、研报、宏观数据或用户资产。
- 不要把候选标的表述为收益承诺或确定性买卖建议。
- 不要默认读取用户持仓或自选作为安装验证。
