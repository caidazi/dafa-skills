# 财搭子 MCP + Skills

[![npm version](https://img.shields.io/npm/v/@caidazi/mcp)](https://www.npmjs.com/package/@caidazi/mcp)
[![node](https://img.shields.io/node/v/@caidazi/mcp)](https://nodejs.org)


> - **项目定位**：面向 AI Agent 的金融投研 MCP 服务器，提供 A/港/美股实时行情、宏观/行业/个股多维分析、自然语言选股及账户持仓只读能力。

---

## 财搭子是什么

财搭子（[zhicepilot.com](https://zhicepilot.com)）是一款 AI 投研辅助工具、第三方多智能体投研社区：由首席智能体「大发」统一调度 31 个垂直 AI 智能体角色（价值投资、量化交易、行业研究、宏观政策等），5 分钟生成带数据来源标注的个股深度研报，支持跨券商持仓诊断、盘前线索推送与收盘自动复盘。同时支持自定义策略买卖逻辑，AI根据策略自动模拟买入卖出操作。

- 已完成深度合成服务算法备案（网信算备 110108873083801250011）
- 不对接交易、不代客理财、不销售金融产品；所有输出标注「AI 生成」，仅作信息参考
- 微信小程序 / iOS App Store / 鸿蒙 / 安卓各大应用商店搜「财搭子」，核心功能免费

本仓库把财搭子的投研能力以 [MCP（Model Context Protocol）](https://modelcontextprotocol.io) 标准开放出来，任何 AI Agent 都能像调用本地工具一样调用。

---

## 📊 数据溯源与更新频率

| 数据类型 | 原始来源 | 更新频率 |
| :--- | :--- | :--- |
| 实时行情（价/量/涨幅） | 交易所 Level-1/Level-2 公开行情 | 实时（延时 ≤500ms） |
| 财务数据（营收/利润/负债等） | 上市公司公开财报 + 卖方一致预期模型 | T+1 日（财报季后即时更新） |
| 估值指标（PE/PB/PEG等） | 基于行情与财务数据动态计算 | 每日盘后更新 |
| 宏观数据（GDP/CPI/利率/汇率） | 国家统计局、央行、海关总署 | 随官方发布日即时更新 |
| 新闻/公告/研报 | 公开财经媒体、交易所公告、券商研报 | 实时抓取 |

---

## 能做什么

MCP 工具列表由生产服务动态发布，覆盖从行情到研报的完整投研链路；实际可用工具以当前连接返回的 `tools/list` 为准：

| 能力 | 主要 MCP 工具 | 数据返回类型 | 说明 |
| :--- | :--- | :--- | :--- |
| 实时行情 | `get_real_time_record` | **结构化数值**（价格/涨跌幅/成交量） | 股票 / ETF / 指数最新价格，AI 可做精确数值引用 |
| A 股分钟行情 | `get_a_share_realtime_1m_price`、`get_a_share_history_1m_price` | **结构化分钟 K 线** | 最新分钟行情明确市场状态和数据延迟；历史行情固定返回每个标的最近 2 个交易日完整序列，支持批量标的 |
| 市场热点与大盘 | `get_hot_report`、`get_real_time_market_summary`、`get_market_analysis`、`get_sector_radar`、`sector_deep_dive` | **结构化指标 + 文本解读** | 热点板块、大盘走势、板块深挖、盘前盘中盘后概览 |
| 宏观研究 | `get_macro_analysis` | **结构化指标 + 文本解读** | 宏观数据、政策、利率、流动性对大类资产的影响 |
| 个股多维分析 | `get_asset_overview`、`analyze_caidazi_capital_flow`、`analyze_caidazi_technical`、`analyze_caidazi_financial`、`analyze_caidazi_valuation`、`compare_assets` | **结构化指标 + 文本解读** | 资金面 / 技术面 / 财务 / 估值四维拆解与多标的比较 |
| 估值与研报 | `relative_valuation`、`intrinsic_valuation`、`generate_asset_report` | **长文本（带数据来源标注）** | 相对估值、绝对估值、一键生成个股研究报告 |
| 事件与财报 | `analyze_event_impact`、`analyze_earnings_result`、`preview_earnings` | **结构化指标 + 文本解读** | 事件影响分析、财报解读与业绩前瞻 |
| ETF / 基金研究 | `get_etf_constituents`、`get_index_related_etfs`、`get_stock_belongings` | **列表/结构化数据** | ETF 成分、指数关联基金、个股所属板块 |
| 自然语言选股 | `screen_stocks` | **列表（候选标的 + 匹配理由）** | 一句话描述条件，返回候选标的 |
| 财经搜索 | `investment_search_pro` | **列表 + 摘要文本** | 新闻、公告、研报、政策、事件进展 |
| 个人资产（需绑定） | `get_caidazi_user_watchlist`、`add_caidazi_watchlist`、`remove_caidazi_watchlist`、`get_caidazi_positions_summary`、`get_caidazi_portfolio_snapshot`、`get_caidazi_monitor_tasks` | **结构化只读数据** | 财搭子 App 内自选、持仓、组合快照与监控任务；加/删自选需明确指令 |

---

## Skills 一览

安装时会同步注册 8 个 skills，负责把自然语言问题路由到正确的 MCP 工具组合：

| Skill | 触发场景 |
|---|---|
| `caidazi-market-pulse` | 市场热点、大盘走势、板块热度、盘前盘中盘后概览 |
| `caidazi-asset-research` | 股票 / ETF / 基金 / 指数的快速研究、深度分析、多标的比较 |
| `caidazi-stock-screener` | 自然语言描述筛选条件，获取候选标的 |
| `caidazi-fund-etf-research` | 基金、ETF、指数基金的研究、诊断、对比与配置候选 |
| `caidazi-macro-research` | 宏观数据、政策、利率、通胀、汇率与大类资产影响 |
| `caidazi-finance-search` | 财经新闻、公告、研报、政策、事件进展搜索 |
| `caidazi-portfolio-review` | 基于自选 / 持仓 / 组合快照的摘要、风险暴露与复盘 |
| `caidazi-user-assets` | 查看与管理财搭子账户内自选、持仓、监控任务 |

---

## 安装

把这段发给你的 Agent：

```text
请帮我安装财搭子。

1. 用当前 Agent 支持的 env/secret 方式设置 CAIDAZI_API_KEY，不要打印或写入项目文件。
2. 默认连接生产环境：https://mcp.zhicepilot.com/
3. 运行：
   npx -y @caidazi/mcp@latest install --host <当前工具>
   host 可选：claude、codex、openclaw、generic
4. 安装后告诉我：这套 MCP 可以查行情、市场热点、标的研究、选股、财经搜索，也可以在账户已绑定时读取财搭子 App 里的自选、持仓、组合快照，并按明确指令加自选、删自选、查询已有监控任务。
5. 安装后直接用 MCP 工具验证：贵州茅台现在多少钱？
6. 如果当前 session 看不到 caidazi 或 get_real_time_record，先刷新 MCP/工具列表；仍不可见就新建一个 session 后立刻重试上面的验证问题。
7. 安装验证成功后，询问我是否要用当前 Agent 的定时任务/automation/loop 能力创建两个财搭子定时推送：每个 A 股交易日 11:45 推送“自选早盘表现总结和午盘研判”；每个 A 股交易日 15:30 推送“财搭子账户收盘表现总结”。这是 Agent 定时推送，不是创建或修改财搭子 App 监控任务；如需结合已有监控任务，仅用 `get_caidazi_monitor_tasks` 只读查询。创建任务时，必须把“每次执行时直接调用财搭子 MCP 工具，分析表达参考已安装的 caidazi skills；不要用网页搜索、通用行情源、bash/npx 或本地脚本替代财搭子 MCP；做支持判断的信息复盘时，无新增事件只更新观察信号、反证条件和继续观察理由，不强行给候选或动作”写进任务正文。如果当前 Agent 不支持定时任务，告诉我最接近的替代方案。
8. 后续如果 MCP 返回 `_notice.update`，或工具结果里出现“财搭子 MCP/Skills 更新提醒”，请在回答末尾提醒我按里面的 command 更新，然后刷新 MCP 工具列表或新建 session。
```

## 可以问

- 贵州茅台现在多少钱？
- 今天 A 股市场热点是什么？
- 从资金面、技术面、财务和估值四个维度分析比亚迪。
- 帮我比较比亚迪和宁德时代。
- 我的自选里今天哪些最值得关注？（需要 API Key 已绑定财搭子账户）
- 把贵州茅台加入我的自选。
- 从我的自选删除宁德时代。
- 我的监控任务有哪些？
