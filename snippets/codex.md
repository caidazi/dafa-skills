# Codex 安装片段

先获取 API Key：

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。

启动 Codex 前设置环境变量：

```bash
export CAIDAZI_API_KEY="<your-caidazi-api-key>"
```

然后把 `caidazi-skills` 文件夹安装或引用到 Codex 的 skills 路径中。安装后可以对 Codex 说：

```text
使用 caidazi-skills 回答行情热点、资产研究、智能选股、已授权财搭子账户资产、财经资讯、基金 ETF、宏观和组合复盘问题。优先调用公开的财搭子 MCP wrapper，并从环境变量读取 CAIDAZI_API_KEY。
```
