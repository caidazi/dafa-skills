# 财搭子外部 Skills

这个仓库是面向 Claude Code、Claude Desktop、Codex、OpenClaw、Cursor 等通用 AI Agent 的公开 skill 包。

这些 skill 刻意保持轻量：只告诉 Agent 什么时候调用财搭子 MCP、遇到 API Key 或工具不可用问题怎么恢复、结果应该如何组织。投资逻辑、数据拼接、候选生成、打分和私有账户访问都留在服务端 MCP wrapper 内部。

统一使用 `CAIDAZI_API_KEY` 作为环境变量。客户端可以为了兼容识别 `CAIZI_API_KEY`，但新增文档和提示词都应优先使用 `CAIDAZI_API_KEY`。

## 给 AI Agent 的快速开始

如果你是正在帮助用户安装本仓库的 AI Agent，请优先阅读本节，并按 `manifest.yaml` 执行。不要根据某个客户端的旧经验臆测配置格式。

### 安装契约

**输入**

- Repo: `https://github.com/caidazi/dafa-skills.git`
- Manifest: `manifest.yaml`
- API Key env: `CAIDAZI_API_KEY`，兼容 `CAIZI_API_KEY`
- MCP server name: 读取 `manifest.yaml` 的 `mcp.server_name`
- MCP endpoint: 优先读取 `manifest.yaml` 的 `mcp.production_endpoint` / `mcp.endpoint`

**安全前置条件**

- 不要生成 API Key。
- 不要要求用户把完整 API Key 粘贴到聊天里。
- 不要通过 `printenv`、`echo`、日志、截图或最终报告回显完整 key。
- 不要把 key 写入仓库、README、issue、pull request 或普通项目配置文件。
- 如果 `mcp.endpoint` 仍是 HTTPS 占位符，请先让项目方或用户提供官方 HTTPS endpoint，不要自动降级到 HTTP 测试端点。
- 如果 MCP endpoint 是 `http://`，不要在公网向它发送 `Authorization: Bearer ...`。只有用户明确确认这是受信任内网、测试环境或本机隧道时，才可以做带 key 的网络验证。公开发布和默认安装应使用 HTTPS endpoint。

**步骤**

1. 拉取仓库并读取 `manifest.yaml`。
2. 安装 skills：
   - 如果当前 Agent 支持 skills，把 `skills.included` 中每个子目录安装到正确 skills 目录。
   - 每个 skill 是独立目录，必须保留 `SKILL.md` 的完整 frontmatter。
   - 如果当前 Agent 不支持 skills，进入 MCP-only 模式，并向用户说明这一限制。
3. 检查 API Key：
   - 优先读取 `CAIDAZI_API_KEY`，兼容读取 `CAIZI_API_KEY`。
   - 如果缺失，引导用户到财搭子 App 领取 key，并通过当前 Agent 支持的 secret store、MCP 配置 UI、本机环境变量或交互式 secret 输入设置。
   - CLI 场景可让用户自己在本机 shell 中设置环境变量；不要让用户把 key 发到聊天里。
4. 配置 MCP：
   - Name: `mcp.server_name`
   - Transport: `streamable-http`、`streamableHttp` 或当前 Agent 对 Streamable HTTP 的等价写法。
   - URL: 优先使用 `mcp.production_endpoint` 或 `mcp.endpoint` 中的 HTTPS endpoint；如果仍是占位符，暂停并要求提供官方 HTTPS endpoint。
   - `mcp.test_endpoint` 仅可在用户明确确认可信测试环境后使用。
   - Header: `Authorization`，格式为 `Bearer {CAIDAZI_API_KEY}`，key 必须来自 secret/env 引用。
   - 优先使用当前 Agent 原生 Streamable HTTP 支持，不要额外包装成其他网关。
5. 验证安装：
   - 必须先做本地验证：skills 是否被索引，MCP 配置是否写入，manifest 是否可解析。
   - 网络验证只在安全传输可用时执行。若 endpoint 仍是明文 HTTP 且用户未明确确认可信环境，跳过带 key 的网络 smoke test，并把原因报告给用户。
   - 只能使用 `required_mcp.smoke_safe_tools` 做 smoke test。
   - 禁止用 `get_caidazi_user_watchlist`、`get_caidazi_positions_summary`、`get_caidazi_portfolio_snapshot` 做安装验证，除非用户之后主动发起个人资产任务。
6. 安装成功后必须完成用户引导：
   - 简短说明公开能力和账户能力的区别。
   - 询问用户想先做哪类任务。
   - 给出几个可直接复制的样例 query。

**成功报告格式**

安装完成或部分完成后，请按下面格式报告：

```text
安装结果：
- Skills 模式：完整安装 / MCP-only / 未支持
- Skills 位置：<路径或原因>
- MCP server：caidazi
- MCP 配置：已写入 / 已生成配置草案 / 未写入
- API Key 状态：存在 / 缺失 / 无效 / 未绑定账户（不回显 key）
- 传输安全：HTTPS / HTTPS endpoint 未配置 / 明文 HTTP，已跳过带 key 网络验证 / 用户确认可信测试环境
- 可见公开工具：<列出部分 public_tools 或说明无法验证>
- 账户工具：仅在用户主动询问自选、持仓或组合时使用
- Smoke test：通过 / 跳过及原因

你想先做哪类任务？
```

## 给用户的快速开始

1. 复制下面的通用安装提示词，发给你的 AI Agent。
2. 如果 Agent 提示缺少 API Key，按它给出的路径到财搭子 App 领取。
3. 通过 Agent 支持的安全方式，把 key 设置为 `CAIDAZI_API_KEY`。不要把完整 key 发到聊天里。
4. 等 Agent 完成安装验证后，直接用样例 query 开始。

### 通用安装提示词

```text
请为我安装财搭子（Caidazi）Skills 和 MCP。

目标：
- Repo: https://github.com/caidazi/dafa-skills.git
- Manifest: manifest.yaml
- 以 manifest.yaml 为安装真源，不要写死某个 Agent 的旧配置路径

执行步骤：
1. 拉取仓库并读取 manifest.yaml。
2. 安装 manifest.yaml 中列出的 skills；如果当前 Agent 不支持 skills，请进入 MCP-only 模式并说明限制。
3. 检查 CAIDAZI_API_KEY，兼容 CAIZI_API_KEY。
   - 如果都没有，不要生成 key，不要要求我把完整 key 发到聊天里。
   - 请告诉我：打开财搭子 App -> 大发 agent 页面 -> 左上角 skill icon -> Skills 页面，领取或复制 API Key，然后通过当前 Agent 支持的 secret store、MCP 配置 UI、本机环境变量或交互式 secret 输入设置为 CAIDAZI_API_KEY。
4. 配置 MCP：
   - name、transport、endpoint 和 auth 请读取 manifest.yaml。
   - 如果 manifest.yaml 里的 HTTPS endpoint 仍是占位符，请先让我提供官方 HTTPS endpoint，不要自动改用 HTTP 测试端点。
   - auth 必须引用 CAIDAZI_API_KEY，不要把完整 key 写入仓库或普通配置文件。
   - 如果 endpoint 是 http://，不要在公网发送 Bearer key；除非我明确确认这是可信测试环境，否则只完成本地配置检查，并跳过带 key 的网络 smoke test。
5. 验证：
   - skills 已被索引，或说明当前 Agent 不支持 skills。
   - MCP 配置已写入或生成配置草案。
   - 网络 smoke test 只能调用 manifest.yaml 中 smoke_safe_tools。
   - 不要调用我的自选、持仓或组合工具做安装验证。
6. 安装成功后，请说明财搭子能做什么，区分公开能力和账户能力，并问我想先做哪类任务，同时给 5 个样例 query。
```

## API Key

使用这些 skill 前，需要先在财搭子 App 中领取 API Key。

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。
5. 在启动你的 AI Agent 前，把这个 key 设置为 `CAIDAZI_API_KEY`。

安全提醒：

- 不要把完整 API Key 粘贴到聊天、日志、README、issue、pull request 或公开配置文件里。
- 优先使用 AI Agent 自带的 secret store、MCP 配置 UI 或本机环境变量。
- CLI 场景建议由用户在自己的本机终端交互式输入或设置环境变量；Agent 不应回显 key。
- Agent 只能报告 key 是否存在、是否可用，不应该回显完整 key。

## MCP Endpoint 安全说明

`manifest.yaml` 使用 HTTPS 生产 endpoint 占位符作为默认值，并保留一个明文 HTTP 测试端点：`http://101.126.22.17:5011/mcp`。

这意味着：

- Agent 可以读取 manifest、安装 skills、生成 MCP 配置草案。
- 对外公开安装前，应将 `manifest.yaml` 的 HTTPS 占位符替换为官方生产 endpoint。
- Agent 不应自动把 HTTPS 占位符降级为 HTTP 测试端点。
- Agent 不应在公网向 HTTP 测试端点发送 `Authorization: Bearer ${CAIDAZI_API_KEY}`。
- 如果用户明确确认 HTTP 测试端点处于受信任内网、测试环境或本机隧道，Agent 可以继续做带 key 验证。

## 客户端适配提示

主流程是通用的。不同客户端只需要把同一组信息写入各自支持的配置位置。

| 客户端 | 建议做法 |
|---|---|
| Claude Code CLI | 使用原生 MCP HTTP/Streamable HTTP 配置能力，配置名为 `caidazi`。如果支持本地 skills，按 `manifest.yaml` 安装每个 skill 目录。 |
| Claude Desktop | 主要使用 MCP。若自定义 skills 支持有限，可进入 MCP-only 模式。 |
| Codex | 让 Agent 检测当前 Codex skills/MCP 配置机制，优先安装 skills；如果不可用，至少生成 MCP 配置草案并说明手工接入点。 |
| OpenClaw | 让 Agent 检测当前 OpenClaw skills/MCP 配置机制，避免写死 Claude 专属路径；如果不可用，降级为 MCP-only。 |
| Cursor | 在 MCP 设置或项目级 MCP 配置中添加 `caidazi`，skills 支持视当前版本而定。 |

示例 MCP 配置片段仅用于说明字段，不代表所有客户端都使用同一种 JSON 格式。公网使用时请替换为 HTTPS endpoint：

```json
{
  "mcpServers": {
    "caidazi": {
      "transport": "streamable-http",
      "url": "https://<your-caidazi-mcp-domain>/mcp",
      "headers": {
        "Authorization": "Bearer ${CAIDAZI_API_KEY}"
      }
    }
  }
}
```

## 安装后能做什么

公开能力：

| 任务 | 对应能力 |
|---|---|
| 市场脉搏 | 市场热点、大盘走势、板块概览、盘前盘中盘后摘要 |
| 单标的研究 | 股票、ETF、基金、指数的快速研究和原因分析 |
| 多标的比较 | 比较多个股票、ETF、基金或指数 |
| 自然语言选股 | 用自然语言筛选候选股票或 ETF |
| 财经搜索 | 搜索资讯、公告、研报、政策和事件进展 |
| 基金 ETF 研究 | 查询 ETF 持仓、指数相关 ETF、基金和 ETF 对比 |
| 宏观研究 | 分析政策、利率、通胀、汇率和大类资产影响 |

账户能力需要 API Key 已绑定财搭子账户，且只能在用户主动询问个人资产时使用：

| 任务 | 对应能力 |
|---|---|
| 用户资产上下文 | 查询并使用财搭子自选、持仓和组合快照 |
| 组合复盘 | 基于财搭子自选、持仓或组合快照做轻量复盘 |

安装成功后，Agent 可以这样引导用户：

```text
财搭子已接入。你可以让我做市场脉搏、单标的研究、多标的比较、自然语言选股、基金/ETF 研究、宏观分析和资讯检索。

如果你的 API Key 已绑定财搭子账户，还可以查看自选、持仓和组合快照，并做轻量复盘。

你想先做哪类任务？
```

样例 query：

- 今天 A 股市场热点是什么？
- 帮我看下宁德时代最近的核心矛盾。
- 比亚迪和宁德时代谁更值得跟踪？
- 找出最近资金强、估值不贵的新能源股票。
- 纳指 ETF 和恒生科技 ETF 怎么选？
- 降息对 A 股和港股分别有什么影响？
- 我的自选里今天哪些最值得关注？（会读取账户资产，需你主动发起）

## 验证与排障

Agent 安装后应报告这些结果：

1. skill 安装模式：完整 skills + MCP，或 MCP-only。
2. skill 安装位置，或无法安装 skills 的原因。
3. MCP server 名称：`caidazi`。
4. MCP 配置状态和传输安全状态。
5. API Key 状态：存在、缺失、无效或未绑定账户，不回显完整 key。
6. 可见公开 MCP tools 概览。
7. 账户工具未用于安装验证的确认。
8. smoke test 结果或跳过原因。

常见问题：

| 问题 | 处理方式 |
|---|---|
| 缺少 API Key | 引导用户到财搭子 App -> 大发 agent 页面 -> 左上角 skill icon -> Skills 页面领取。 |
| API Key 无效或过期 | 引导用户重新领取并更新 `CAIDAZI_API_KEY`。 |
| HTTPS endpoint 未配置 | 请项目方或用户提供官方 HTTPS endpoint；不要自动降级到 HTTP 测试端点。 |
| endpoint 是 HTTP | 不在公网发送 Bearer key；改用 HTTPS endpoint，或由用户明确确认可信测试环境后再验证。 |
| MCP tools 不可见 | 检查 transport、URL、header、网络连通性和客户端是否支持 Streamable HTTP。 |
| Agent 不支持 skills | 进入 MCP-only 模式，仍可使用工具，但少了自动路由和表达规则。 |
| 用户资产工具不可用 | 说明需要账户关联 key；不要推断未返回的自选、持仓、成本、盈亏或仓位。 |

## 公开边界

公开 skill 不得包含内部表名、原始查询指令、内部账户工具名或具体打分规则。

Agent 使用这些 skill 时也应遵守：

- 不要暴露 API Key、内部 endpoint 之外的私有路径或账户细节。
- 不要编造行情、公告、研报、宏观数据或用户资产。
- 不要把候选标的表述为收益承诺或确定性买卖建议。
- 不要默认读取用户持仓或自选作为安装验证。
