---
name: caidazi-fund-etf-research
description: 当用户询问基金、ETF、指数基金的研究、筛选、诊断、对比或配置候选时使用。
---

# 财搭子基金 ETF 研究

用这个 skill 处理基金和 ETF 高频问题。公开 skill 只负责查询、筛选、比较和表达，基金评价、归因、持仓去噪和评分逻辑留在 MCP 内部。

## 适用场景

- "帮我看看这只 ETF"
- "找几个港股科技 ETF"
- "沪深300 ETF 哪个更适合跟踪"
- "这只基金最近表现为什么差"
- "我的自选里 ETF 哪些值得关注"

不要用于基金销售承诺、收益保证、自动调仓或复杂资产配置方案。

## 可用工具

- `get_asset_overview`
- `get_real_time_record`
- `investment_search_pro`
- `screen_stocks`
- `compare_assets`
- `get_etf_constituents`
- `get_index_related_etfs`
- `get_stock_belongings`
- `get_caidazi_user_watchlist`

## 流程

单只基金或 ETF：

1. 识别名称或代码。
2. 如果用户只问当前价格、涨跌幅、盘中表现或实时行情，调用 `get_real_time_record(symbol=...)` 后停止，不要继续调用 `get_asset_overview`。
3. 用户需要研究、结构、费用、风险或持仓解释时，调用 `get_asset_overview(symbol=...)`。
4. 如果用户关心 ETF 持仓结构，调用 `get_etf_constituents(symbol, top_n)`。
5. 只展示工具返回的规模、跟踪对象、费用、风险、持仓、实时行情和近期变化。

筛选基金或 ETF：

1. 把用户条件整理成自然语言 query。
2. 推断市场或品类：A 股 ETF、港股 ETF、美股 ETF、基金。
3. 调用 `screen_stocks(query, market="ETF", limit)`。
4. 不要手动构造字段筛选。

对比：

1. 两个或更多基金/ETF 时调用 `compare_assets(symbols, metrics, period)`；`metrics` 只使用 `price`、`valuation`、`capital`、`overview`。
2. 不要循环调用多个底层工具拼表。

## 澄清策略

最多问一个问题。只有在基金名称高度歧义，或用户只说"推荐几个基金"但没有任何市场、方向或风格时提问。

## 输出结构

1. 一句话结论。
2. 实时行情或核心指标，如果工具返回。
3. 候选表格或持仓结构。
4. 适合继续研究的原因。
5. 主要风险和数据时间。
6. 下一步建议：比较、看持仓、查新闻或加入自选。

## 错误处理

- API Key 无效：引导用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面重新领取。
- 工具调用失败：按工具返回的 `message` 说明，不自行推断后台策略。
- 未找到基金：请用户提供更准确的名称或代码。
- 空结果：建议放宽费率、规模、主题、市场或时间条件。

## 边界

- 不要承诺收益或保本。
- 不要暴露基金评分模型、归因规则或候选池逻辑。
- 不要输出内部字段、表名或 SQL。
- 不要给明确买卖指令。
