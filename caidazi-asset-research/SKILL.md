---
name: caidazi-asset-research
description: 当用户询问股票、ETF、基金、指数的快速研究、深度分析或多标的比较时使用。仅查询最新行情、当前价格、涨跌幅、成交量/额时不要使用本 skill，直接调用 MCP 工具 get_real_time_record。
---

# 财搭子资产研究

用这个 skill 处理单个标的快速研究、深度研究和简单多标的比较。公开流程要尽量少澄清，优先通过已配置的 MCP 工具完成；深度研究需要用服务端工具补齐资金面、技术面、财务面和估值面，不在本地复刻分析模型。

如果 MCP 工具没有出现在当前可调用工具列表里，先使用当前 Agent 的 MCP 工具发现、刷新或延迟加载机制查找 `caidazi`。如果运行环境提供 `tool_search` 这类工具发现能力，必须先搜索 `caidazi` 或目标工具名；只有工具发现失败，或宿主 MCP 工具列表确认没有 `caidazi` 时，才说明 MCP 尚未连接并请用户完成配置。不要为了回答单次查询临时启动 npm 包、手写 JSON-RPC 或把 API Key 放进命令。

如果用户只是问"最新行情"、"现在多少钱"、"今天涨跌多少"、"成交额/成交量"，不要为了读取本 skill 再派生 Agent 或扫描本地文件；直接调用 MCP 工具 `get_real_time_record(symbol=...)` 并返回工具结果。

## 适用场景

- "帮我看看贵州茅台"
- "帮我深度分析一下宁德时代"
- "这个 ETF 怎么样"
- "纳指和恒生科技对比一下"
- "比亚迪和宁德时代谁更强"
- "这只股票最近为什么动"
- "我的自选里哪几个值得重点关注"

不要用于完整组合诊断、交易执行、自然语言选股、行业深度或长篇研报生成。

## 可用工具

- `extract_assets`
- `get_asset_overview`
- `get_real_time_record`
- `analyze_caidazi_capital_flow`
- `analyze_caidazi_technical`
- `analyze_caidazi_financial`
- `analyze_caidazi_valuation`
- `investment_search_pro`
- `compare_assets`
- `get_caidazi_user_watchlist`
- `get_caidazi_positions_summary`

## 标的识别

用户给出明确代码或名称时直接继续。名称有歧义时调用 `extract_assets`。如果多个标的都可能匹配，且用户只想看一个，最多问一个澄清问题。

当用户提到财搭子私有数据：

- "我的自选"：调用 `get_caidazi_user_watchlist()`。
- "我的持仓"：调用 `get_caidazi_positions_summary(mask_sensitive=true)`。

如果账户数据不可用，说明用户可到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面领取或绑定账户关联 API Key；在有价值时继续用公开行情数据回答。

## 路由优先级

1. 用户只问当前价格、最新行情、涨跌幅、成交额、成交量、实时走势：不要进入研究流程，直接调用 `get_real_time_record(symbol=...)`。
2. 用户说"看看"、"怎么样"、"核心矛盾"：使用快速研究流程。
3. 用户说"深度"、"全面"、"诊断"、"资金面/技术面/财务/估值"，或要求类似财搭子内部产品的分析：使用深度研究流程。
4. 用户给出两个或更多标的：使用多标的比较流程。
5. 用户主要问"我的自选/我的持仓有哪些"：优先交给 `caidazi-user-assets`；拿到标的后再回到本 skill 做研究。

## 实时行情流程

这个流程只作为本 skill 已被误触发时的纠偏路径；正常情况下，纯行情查询应由 Agent 直接调用 MCP 工具。

1. 识别标的；名称有歧义时先调用 `extract_assets`。
2. 调用 `get_real_time_record(symbol=...)`。
3. 输出最新价、涨跌幅、成交量/成交额、交易日期时间，以及工具返回的覆盖限制。
4. 到此停止。只有用户继续问"为什么涨跌"、"怎么看"或"核心矛盾"时，才进入快速研究或资讯检索；不要因为查行情顺手调用 `get_asset_overview`。

## 快速研究流程

1. 识别标的。
2. 如果用户只要行情，改走实时行情流程并停止。
3. 调用 `get_asset_overview(symbol=...)`。
4. 用户问"为什么"、"最新"、"新闻"，或提到具体事件时，再调用 `investment_search_pro`。
5. 只基于工具返回内容回答。

## 深度研究流程

深度研究默认围绕四个维度组织；如果用户只点名其中一个维度，只调用对应工具。

1. 先调用 `get_asset_overview(symbol=...)` 建立核心逻辑和主要矛盾。
2. 如果用户关心当天表现或当前价格，调用 `get_real_time_record(symbol=...)`。
3. 资金面：调用 `analyze_caidazi_capital_flow(symbol=...)`。
4. 技术面：调用 `analyze_caidazi_technical(symbol=...)`。
5. 财务面：调用 `analyze_caidazi_financial(symbol=...)`。
6. 估值面：调用 `analyze_caidazi_valuation(symbol=...)`。
7. 如果用户问"最近为什么动"或有具体事件，再调用 `investment_search_pro(query=...)` 补充新闻、公告或研报。
8. 综合各工具返回，说明哪些维度互相印证、哪些维度互相冲突，以及接下来最值得验证的信号。

## 多标的比较

两个或更多标的时优先使用 `compare_assets`。

推荐参数：

- `symbols`：来自用户或 `extract_assets` 的规范化代码/名称。
- `metrics`：只能使用 `compare_assets` 支持的指标组，默认 `["price", "valuation", "capital", "overview"]`。用户说资金面时用 `"capital"`；用户说财务、基本面、技术面或核心逻辑时先用 `"overview"` 承接。
- `period`：默认 `"latest"`；用户提到今天、本周、本月时分别使用对应周期。

当 `compare_assets` 能完成任务时，不要手动循环调用原始工具。

如果用户明确要求比较技术面、资金面、财务面或估值细节，而 `compare_assets` 返回不足，再对每个标的调用对应的 `analyze_caidazi_technical`、`analyze_caidazi_capital_flow`、`analyze_caidazi_financial` 或 `analyze_caidazi_valuation` 补充；不要把 `technical`、`financial`、`capital_flow` 当作 `compare_assets.metrics` 直接传入。

## 澄清策略

最多问一个问题，限于这些情况：

- 标的无法确定；
- 比较对象缺失；
- 用户问"我的资产"，但 API Key 未关联账户且任务无法继续。

不要询问风险偏好。这个 skill 只做研究和比较。

## 输出结构

单标的：

1. 一句话观点。
2. 实时行情：价格、涨跌幅、成交额和数据时间，如果已调用实时行情工具。
3. 核心逻辑：业务、位置、主要矛盾、近期变化。
4. 四维分析：资金面、技术面、财务面、估值面；未调用的维度明确省略，不要补写。
5. 交叉验证：哪些维度互相支持，哪些维度存在冲突。
6. 催化与风险：事件、行业、资金或基本面线索。
7. 待验证问题：哪些数据会改变当前判断。

多标的：

1. 简短结论。
2. 表格列出每个标的和用户关心的指标。
3. 主要差异。
4. 数据缺口。

## 错误处理

- API Key 无效或过期：引导用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面重新领取。
- 工具调用失败：按工具返回的 `message` 说明，不自行推断后台策略。
- 标的未找到：请用户补充更清晰的代码或名称。
- 工具未出现在当前 MCP 列表：先刷新或发现 `caidazi` 工具；仍不可用时说明 MCP 尚未连接或该能力暂不可用。
- 某个深度维度不可用：保留已返回维度，明确缺失项，不要用其他维度替代。

## 边界

- 不要说"如果我是你"，不要给直接买卖指令。
- 不要暴露内部打分、字段映射或工具编排细节。
- 不要提内部服务名。
- 不要透露 API Key。
- 不要把技术指标或资金流入写成确定性买卖信号。
