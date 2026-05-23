---
name: caidazi-market-pulse
description: 当用户询问市场热点、大盘走势、宏观影响、板块热度、盘前盘中盘后概览时使用。
---

# 财搭子市场脉搏

用这个 skill 把宽泛的市场问题转成稳定的财搭子 MCP 调用。公开 skill 只负责路由和表达，不在本地复刻市场打分逻辑。

## 适用场景

- "今天市场热点是什么"
- "A股/港股/美股怎么看"
- "大盘为什么涨/跌"
- "最近宏观有什么影响"
- "哪些板块比较热"
- "帮我做个盘前/盘中/收盘概览"

不要用于深度单股研究、自然语言选股、完整行业深度或用户私有资产分析。

## 可用工具

- `get_hot_report`
- `get_real_time_market_summary`
- `get_market_analysis`
- `get_macro_analysis`
- `investment_search_pro`
- `get_caidazi_portfolio_snapshot`，仅当用户明确询问"我的自选"或"我的持仓"时使用。

## 快速流程

1. 判断市场范围：A 股、港股、美股、ETF 或全球。
2. 用户问"今天"、"现在"、"盘中"、"实时"时，直接调用 `get_real_time_market_summary`。
3. 用户问热点、主题或活跃板块时，直接调用 `get_hot_report`。
4. 用户问大盘方向、估值或市场状态时，直接调用 `get_market_analysis`。
5. 用户问利率、政策、通胀、流动性或全球宏观时，直接调用 `get_macro_analysis`。
6. 只有当摘要工具覆盖不足，且用户提到具体事件或最新新闻时，再用 `investment_search_pro` 补充。

## 私有资产上下文

当用户问"我的自选受影响吗"或"对我的持仓怎么看"：

1. 调用 `get_caidazi_portfolio_snapshot(scope="all", mask_sensitive=true)`。
2. 如果返回 API Key 未绑定账户，提示用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面领取或绑定 key。
3. 如果返回了资产，只基于返回资产分析市场影响，不要编造未返回的持仓。

## 澄清策略

最多问一个问题，并且只在市场或时间范围完全无法判断时提问。

好问题：

> 你想看 A 股、港股、美股，还是全部市场？

不要询问风险偏好。这个 skill 是市场研究入口，不是交易决策入口。

## 输出结构

保持简洁：

1. 一句话结论。
2. 三到五个市场驱动因素。
3. 热门板块、资金或资产，如果工具返回。
4. 接下来值得观察的信号。
5. 数据时间、延迟或覆盖限制，如果有。

只有在比较多个板块或指数时使用表格。优先用自然中文解释，少用公式。

## 错误处理

- `API_KEY_INVALID`：说明 key 无效或过期，引导用户到 财搭子 App -> 大发 agent -> 左上角 skill icon -> Skills 页面重新领取。
- `TOOL_NOT_AVAILABLE_EXTERNALLY`：说明该能力暂未对外部 Agent 开放。
- 其他工具错误：按工具返回的 `message` 用中文解释，不自行推断后台策略。

## 边界

- 不要把工具结果包装成投资建议。
- 不要编造指数点位、宏观数据、板块排名或新闻。
- 不要透露内部排名、权重、数据拼接或账户查询细节。
- 不要在回答中暴露 API Key。
