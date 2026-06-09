# 财搭子 MCP + Skills

面向通用 AI Agent 的财搭子 MCP 和 skills。一个 npm 命令会安装 skills；支持的 Agent 会自动注册 MCP，其他 Agent 会输出标准 MCP 配置。

## 安装

把这段发给你的 Agent：

```text
请帮我安装财搭子。

1. 用安全的环境变量方式设置 CAIDAZI_API_KEY，不要打印或写入项目文件。
2. 当前先使用测试环境：
   CAIDAZI_BASE_URL=http://101.126.22.17:5011
   CAIDAZI_ALLOW_HTTP=true
3. 运行：
   npx -y @caidazi/mcp@latest install --host <当前工具>
   host 可选：claude、codex、openclaw、generic
4. 安装后直接用 MCP 工具验证：贵州茅台现在多少钱？
5. 如果当前 session 看不到 caidazi 或 get_real_time_record，新建一个 session 后再试。
```

## 可以问

- 贵州茅台现在多少钱？
- 今天 A 股市场热点是什么？
- 从资金面、技术面、财务和估值四个维度分析比亚迪。
- 帮我比较比亚迪和宁德时代。
- 我的自选里今天哪些最值得关注？（需要 API Key 已绑定财搭子账户）
