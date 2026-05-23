# 财搭子外部 Skills

这个目录是面向 Codex、Claude Code、OpenClaw 等通用 Agent 的公开 skill 包。

这些 skill 刻意保持轻量：只告诉 Agent 什么时候调用财搭子 MCP、遇到 API Key 或工具不可用问题怎么恢复、结果应该如何组织。投资逻辑、数据拼接、候选生成、打分和私有账户访问都留在服务端 MCP wrapper 内部。

统一使用 `CAIDAZI_API_KEY` 作为环境变量。客户端可以为了兼容识别 `CAIZI_API_KEY`，但新增文档和提示词都应优先使用 `CAIDAZI_API_KEY`。

## 获取 API Key

使用这些 skill 前，需要先在财搭子 App 中领取 API Key。

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。
5. 在启动 Codex、Claude Code、OpenClaw 或其他外部 Agent 前，把这个 key 设置为 `CAIDAZI_API_KEY`。

请保护好 API Key。安装流程可以展示脱敏后的 key 用于确认，但不要把完整 key 粘贴到聊天、日志或公开文件里。

已交付能力：

- `caidazi-market-pulse`
- `caidazi-asset-research`
- `caidazi-stock-screener`
- `caidazi-user-assets`
- `caidazi-finance-search`
- `caidazi-fund-etf-research`
- `caidazi-macro-research`
- `caidazi-portfolio-review`

公开 skill 不得包含内部表名、原始查询指令、内部账户工具名或具体打分规则。
