# 财搭子 MCP + Skills

面向通用 AI Agent 的财搭子 MCP 和 skills。一个 npm 命令会安装 skills；支持的 Agent 会自动注册 MCP，其他 Agent 会输出标准 MCP 配置。

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
