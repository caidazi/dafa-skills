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
