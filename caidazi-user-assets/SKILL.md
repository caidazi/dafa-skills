---
name: caidazi-user-assets
description: 当用户想查看或使用自己在财搭子的自选、持仓、账户关联资产或个人资产上下文时使用。
---

# 财搭子用户资产

用这个 skill 通过账户关联 API Key 访问用户在财搭子里的数据资产。它是外部 Agent 回到财搭子主端的桥，不是组合诊断引擎。

路由优先级：用户只是查看自选、持仓或账户资产上下文时使用本 skill；用户要复盘风险暴露时使用 `caidazi-portfolio-review`；用户指定某个返回资产做实时行情或研究时，再交给 `caidazi-asset-research`。

## 适用场景

- "查看我的自选"
- "我的持仓有哪些"
- "用我的自选做对比"
- "看一下我的持仓受这个消息影响吗"
- "从我的资产里筛一下"

不要用于交易、账户修改、订阅设置或深度组合诊断。

## 可用工具

- `get_caidazi_user_watchlist`
- `get_caidazi_positions_summary`
- `get_caidazi_portfolio_snapshot`

## 流程

1. 判断 `asset_type`：
   - watchlist：用户说自选、watchlist、关注资产。
   - holdings：用户说持仓、托管、positions。
   - all：用户说我的资产、个人上下文，或同时需要自选和持仓。
2. 自选调用 `get_caidazi_user_watchlist`，持仓调用 `get_caidazi_positions_summary(mask_sensitive=true)`，全部资产调用 `get_caidazi_portfolio_snapshot(mask_sensitive=true)`。
3. 如果工具返回 `requires_login`、`account_not_linked` 或 `ASSET_PERMISSION_REQUIRED`，提示用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面领取或绑定 API Key。
4. 如果返回数据，只总结工具返回的资产和安全公开字段。
5. 如果下一步是研究，把返回代码交给 `caidazi-asset-research`、`caidazi-stock-screener`、`caidazi-market-pulse` 或 `caidazi-finance-search`。

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

## 交接

- 研究某个返回资产：使用 `caidazi-asset-research`。
- 比较多个返回资产：使用 `compare_assets`。
- 在返回资产中筛选：使用 `caidazi-stock-screener`。
- 分析新闻或政策影响：使用 `caidazi-finance-search`，必要时再结合 `caidazi-market-pulse`。

## 错误处理

- API Key 无效：引导用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面重新领取。
- API Key 未关联财搭子账户：解释同一路径可以领取或绑定。
- 工具调用失败：按工具返回的 `message` 总结，不自行推断后台策略。
- 工具未开放：说明账户资产访问暂未对外部 Agent 开放。

## 边界

- 不要暴露 API Key。
- 不要声称拥有完整券商账户访问权。
- 不要修改自选或持仓。
- 用户没有要求时，不要主动使用私有资产。
- 不要仅基于账户上下文给买卖指令。
