---
name: caidazi-asset-research
description: 当用户询问股票、ETF、基金、指数的快速研究，或想比较多个标的时使用。
---

# 财搭子资产研究

用这个 skill 处理单个标的研究和简单多标的比较。公开流程要尽量少调用、少澄清，优先通过 MCP wrapper 完成。

## 适用场景

- "帮我看看贵州茅台"
- "这个 ETF 怎么样"
- "纳指和恒生科技对比一下"
- "比亚迪和宁德时代谁更强"
- "这只股票最近为什么动"
- "我的自选里哪几个值得重点关注"

不要用于完整组合诊断、交易执行、自然语言选股或长篇研报。

## 可用工具

- `extract_assets`
- `get_asset_overview`
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

## 单标的流程

1. 识别标的。
2. 调用 `get_asset_overview(symbol=...)`。
3. 用户问"为什么"、"最新"、"新闻"，或提到具体事件时，再调用 `investment_search_pro`。
4. 只基于工具返回内容回答。

## 多标的比较

两个或更多标的时优先使用 `compare_assets`。

推荐参数：

- `symbols`：来自用户或 `extract_assets` 的规范化代码/名称。
- `metrics`：按用户问题推断，默认 `["price", "valuation", "overview"]`。
- `period`：默认 `"latest"`；用户提到今天、本周、本月时分别使用对应周期。

当 `compare_assets` 能完成任务时，不要手动循环调用原始工具。

## 澄清策略

最多问一个问题，限于这些情况：

- 标的无法确定；
- 比较对象缺失；
- 用户问"我的资产"，但 API Key 未关联账户且任务无法继续。

不要询问风险偏好。这个 skill 只做研究和比较。

## 输出结构

单标的：

1. 一句话观点。
2. 概况：业务、位置、近期变化。
3. 催化：事件、行业或资金线索。
4. 估值/资金/风险：只展示工具返回内容。
5. 待验证问题：哪些数据会改变当前判断。

多标的：

1. 简短结论。
2. 表格列出每个标的和用户关心的指标。
3. 主要差异。
4. 数据缺口。

## 错误处理

- API Key 无效或过期：引导用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面重新领取。
- 工具调用失败：按工具返回的 `message` 说明，不自行推断后台策略。
- 标的未找到：请用户补充更清晰的代码或名称。
- 工具未开放：说明该能力暂未对外部 Agent 开放。

## 边界

- 不要说"如果我是你"，不要给直接买卖指令。
- 不要暴露内部打分、字段映射或工具编排细节。
- 不要提内部服务名。
- 不要透露 API Key。
