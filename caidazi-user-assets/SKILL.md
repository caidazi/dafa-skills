---
name: caidazi-user-assets
description: 当用户想查看或使用自己在财搭子的自选、持仓、监控任务、账户关联资产或个人资产上下文时使用；也处理明确的加自选、删自选请求。
---

# 财搭子用户资产

用这个 skill 通过账户关联 API Key 访问用户在财搭子里的数据资产。它是外部 Agent 回到财搭子主端的桥，不是组合诊断引擎。

路由优先级：用户只是查看自选、持仓、存量监控任务或账户资产上下文时使用本 skill；用户明确要求加自选或删自选时也使用本 skill；用户要复盘风险暴露时使用 `caidazi-portfolio-review`；用户指定某个返回资产只查实时行情时直接调用 MCP 工具 `get_real_time_record`；需要研究解释时再交给 `caidazi-asset-research`。

## 适用场景

- "查看我的自选"
- "我的持仓有哪些"
- "用我的自选做对比"
- "看一下我的持仓受这个消息影响吗"
- "从我的资产里筛一下"
- "把贵州茅台加入我的自选"
- "从我的自选删除宁德时代"
- "我的监控任务有哪些"

不要用于交易、持仓修改、订阅新监控或深度组合诊断。加自选、删自选只在用户明确要求时执行。

## 可用工具

- `get_caidazi_user_watchlist`
- `get_caidazi_positions_summary`
- `get_caidazi_portfolio_snapshot`
- `add_watchlist`
- `remove_watchlist`
- `get_monitor_tasks`
- `extract_assets`

如果这些工具没有出现在当前可调用工具列表里，先使用当前 Agent 的 MCP 工具发现、刷新或延迟加载机制查找 `caidazi`。如果运行环境提供 `tool_search` 这类工具发现能力，必须先搜索 `caidazi` 或上述工具名；只有工具发现失败，或宿主 MCP 工具列表确认没有 `caidazi` 时，才说明 MCP 尚未连接。不要在未做工具发现前直接说"工具未开放"。

## 流程

1. 先判断意图：
   - 查看资产：读取自选、持仓或全部资产。
   - 加自选：用户明确说加入自选、关注、加到自选。
   - 删自选：用户明确说删除自选、取消关注、从自选移除。
   - 查监控：用户问已有监控、存量监控、提醒任务、监控任务列表。
2. 查看资产时判断 `asset_type`：
   - watchlist：用户说自选、watchlist、关注资产。
   - holdings：用户说持仓、账户持仓、positions。
   - all：用户说我的资产、个人上下文，或同时需要自选和持仓。
3. 自选调用 `get_caidazi_user_watchlist`，持仓调用 `get_caidazi_positions_summary(mask_sensitive=true)`，全部资产调用 `get_caidazi_portfolio_snapshot(mask_sensitive=true)`。
4. 加自选时，先得到规范证券代码；多个代码用逗号传给 `add_watchlist(ts_codes=...)`。如果用户只给名称且有歧义，先用 `extract_assets`，仍不确定再最多问一个问题。
5. 删自选时，先得到单个规范证券代码，调用 `remove_watchlist(ts_code=...)`。如果用户要删多个，逐个调用或请用户确认明确列表。
6. 查监控任务时调用 `get_monitor_tasks(status, ts_codes)`；用户说进行中/已结束时分别传 `active`/`ended`，用户限定标的时先规范成证券代码再传 `ts_codes`，否则不传筛选。
7. 如果工具返回 `requires_login`、`account_not_linked` 或 `ASSET_PERMISSION_REQUIRED`，提示用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面领取或绑定 API Key。
8. 如果返回数据，只总结工具返回的资产、任务和安全公开字段。
9. 如果下一步是研究，把返回代码交给 `caidazi-asset-research`、`caidazi-stock-screener`、`caidazi-market-pulse` 或 `caidazi-finance-search`。

## 输出结构

自选：

- 总数量；
- 可见的重点资产；
- 数据缺失或延迟提醒；
- 下一步可做什么。

持仓：

- 总数量；
- 资产名称和代码；
- 如果工具返回了高层持仓信息，可以概括；
- 避免给具体交易指令。

全部资产：

- 清楚区分自选和持仓。

监控任务：

- 任务数量；
- 任务状态；
- 关联资产或条件；
- 最近执行情况，如果工具返回。

## 数据边界

严格使用工具返回的数据。不要推断未返回的成本、数量、盈亏或风险偏好。字段未返回就说明不可用。

## 示例

用户：

> 看下我的自选

动作：

- 调用 `get_caidazi_user_watchlist()`；
- 总结数量和可见资产。

用户：

> 我的持仓受今天热点影响吗？

动作：

- 调用 `get_caidazi_positions_summary(mask_sensitive=true)`；
- 把返回代码交给市场脉搏或事件影响 skill。

用户：

> 从我的自选里选几个强一点的

动作：

- 调用 `get_caidazi_user_watchlist()`；
- 把资产范围传给智能筛选。

用户：

> 把贵州茅台加入我的自选

动作：

- 识别为 `600519.SH`；
- 调用 `add_watchlist(ts_codes="600519.SH")`；
- 返回工具确认结果。

用户：

> 我的进行中监控任务有哪些

动作：

- 调用 `get_monitor_tasks(status="active")`；
- 总结任务数量、关联资产和最近执行情况。

## 交接

- 研究某个返回资产：使用 `caidazi-asset-research`。
- 比较多个返回资产：使用 `compare_assets`。
- 在返回资产中筛选：使用 `caidazi-stock-screener`。
- 分析新闻或政策影响：使用 `caidazi-finance-search`，必要时再结合 `caidazi-market-pulse`。

## 错误处理

- API Key 无效：引导用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面重新领取。
- API Key 未关联财搭子账户：解释同一路径可以领取或绑定。
- 工具调用失败：按工具返回的 `message` 总结，不自行推断后台策略。
- 工具发现失败或 MCP 未连接：说明当前 Agent 尚未连接财搭子 MCP，请用户完成安装、刷新工具列表或新建 session。不要说账户资产访问未对外部 Agent 开放。

## 边界

- 不要暴露 API Key。
- 不要声称拥有完整券商账户访问权。
- 不要修改持仓；只在用户明确要求时加自选或删自选。
- 不要新建、订阅或删除监控任务；本 skill 只查询已有监控任务。
- 用户没有要求时，不要主动使用私有资产。
- 不要仅基于账户上下文给买卖指令。
