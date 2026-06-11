---
name: caidazi-portfolio-review
description: 当用户希望基于财搭子自选、持仓或组合快照做摘要、风险暴露、变动检查或复盘时使用。
---

# 财搭子组合复盘

用这个 skill 做轻量组合摘要和风险暴露检查。它依赖账户关联 API Key，是主端回流入口；不要把它写成完整组合诊断或自动调仓能力。

路由优先级：用户只是查看自选、持仓列表时使用 `caidazi-user-assets`；用户只要单个标的实时行情时直接调用 MCP 工具 `get_real_time_record`；用户要看单个标的资金面、技术面、财务、估值或研究解释时使用 `caidazi-asset-research`；用户要看组合整体暴露、重合、风险或复盘时使用本 skill。

## 适用场景

- "帮我复盘一下我的持仓"
- "我的组合最近风险在哪里"
- "我的自选和持仓有哪些重合"
- "看一下我的资产受今天热点影响吗"
- "给我的组合做个摘要"

不要用于下单、调仓、收益承诺或完整投顾建议。

## 可用工具

- `get_caidazi_portfolio_snapshot`
- `get_caidazi_positions_summary`
- `get_caidazi_user_watchlist`
- `get_real_time_market_summary`
- `get_hot_report`
- `investment_search_pro`

如果这些工具没有出现在当前可调用工具列表里，先使用当前 Agent 的 MCP 工具发现、刷新或延迟加载机制查找 `caidazi`。如果运行环境提供 `tool_search` 这类工具发现能力，必须先搜索 `caidazi` 或上述工具名；只有工具发现失败，或宿主 MCP 工具列表确认没有 `caidazi` 时，才说明 MCP 尚未连接。

## 流程

1. 调用 `get_caidazi_portfolio_snapshot(scope="all", mask_sensitive=true)`。
2. 如果工具返回未授权，提示用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面领取或绑定 API Key。
3. 如果用户问市场影响，再调用 `get_real_time_market_summary` 或 `get_hot_report`。
4. 如果用户问某个事件影响，再调用 `investment_search_pro` 补充事实。
5. 只基于返回资产做摘要，不要推断完整券商账户。

## 澄清策略

最多问一个问题。只有在用户要复盘但没有说明看自选、持仓还是全部资产时，可以默认 `all`，不要打断。

## 输出结构

1. 组合快照：资产数量、市场分布、可见范围。
2. 主要暴露：行业、主题、单一资产集中度，仅展示工具返回内容。
3. 今日或近期关联事件，如果有。
4. 待检查事项：需要用户回主端确认的数据。
5. 下一步建议：研究某个资产、筛选候选或查看市场脉搏。

## 错误处理

- `ASSET_PERMISSION_REQUIRED` 或未绑定账户：引导用户回财搭子领取或绑定 key。
- API Key 无效：引导用户重新领取。
- 工具调用失败：按工具返回的 `message` 说明，不自行推断后台策略。
- 持仓不可用但自选可用：说明边界，继续用自选做轻量复盘。

## 边界

- 不要声称拥有完整券商账户访问权。
- 不要展示工具未返回的金额、成本、盈亏或仓位。
- 不要给直接买卖和调仓指令。
- 不要持续监控或订阅提醒。
