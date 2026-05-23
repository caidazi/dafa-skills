# Claude Code 安装片段

先获取 API Key：

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。

启动 Claude Code 前设置环境变量：

```bash
export CAIDAZI_API_KEY="<your-caidazi-api-key>"
```

把 `caidazi-skills` 文件夹复制到 Claude skills 目录，或让 Claude Code 指向这个目录。然后可以说：

```text
安装 caidazi-skills，并使用财搭子 MCP 工具处理市场热点、资产研究、智能选股、财经资讯、基金 ETF、宏观、组合复盘和已授权账户资产问题。不要在聊天里暴露我的 API Key。
```
