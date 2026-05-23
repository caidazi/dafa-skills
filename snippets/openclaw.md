# OpenClaw 安装片段

先获取 API Key：

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。

在外部 Agent 环境中设置：

```bash
export CAIDAZI_API_KEY="<your-caidazi-api-key>"
```

把下面提示发给 OpenClaw：

```text
从提供的 skills 文件夹安装 caidazi-skills。使用环境变量 CAIDAZI_API_KEY 配置财搭子 MCP。只调用公开 wrapper 工具，覆盖行情、研究、选股、资讯、基金 ETF、宏观和账户资产，并用中文解释 API Key 或工具不可用错误。
```
