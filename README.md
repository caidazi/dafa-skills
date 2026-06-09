# 财搭子 MCP + Skills

面向通用 AI Agent 的财搭子 MCP 和 skills。MCP 通过 npm 安装，skills 随 npm 包一起安装到当前 Agent 的技能目录。

当前统一使用 `CAIDAZI_API_KEY`。

## 快速开始

把这段发给你的 Agent：

```text
请帮我安装财搭子。

1. 用安全的环境变量方式设置 CAIDAZI_API_KEY，不要打印或写入项目文件。
2. 当前先使用测试环境：
   CAIDAZI_BASE_URL=http://101.126.22.17:5011
   CAIDAZI_ALLOW_HTTP=true
3. 按当前工具选择一个命令运行：
   Claude Code: npx -y @caidazi/mcp@latest install --host claude
   Codex:       npx -y @caidazi/mcp@latest install --host codex
4. 安装后检查 MCP 工具列表里能直接看到 caidazi / get_real_time_record。
5. 如果当前 session 还看不到工具，新建一个 session 后验证：贵州茅台现在多少钱？
```

## 人工安装

```bash
export CAIDAZI_API_KEY="你的 key"
export CAIDAZI_BASE_URL="http://101.126.22.17:5011"
export CAIDAZI_ALLOW_HTTP=true

# Claude Code
npx -y @caidazi/mcp@latest install --host claude

# Codex
npx -y @caidazi/mcp@latest install --host codex
```

## 验证

```bash
npx -y @caidazi/mcp@latest validate --probe
```

在 Agent 里验证时，必须是 MCP 工具列表直接出现 `caidazi` 或 `get_real_time_record`。只安装 skills、只在 skill 文本里看到工具名，或只把配置写进普通 `settings.json`，都不算 MCP 安装成功。

## 能做什么

- 实时行情：当前价、涨跌幅、成交量/额。
- 市场脉搏：热点、大盘走势、板块变化和市场摘要。
- 单标的研究：股票、ETF、基金、指数的核心矛盾和深度研究。
- 四维资产分析：资金面、技术面、财务面和估值面。
- 多标的比较、自然语言选股、财经搜索、基金/ETF 研究、宏观研究。
- 账户能力：自选、持仓、组合快照和轻量复盘，需要 API Key 已绑定财搭子账户。

## 维护者

```bash
npm install
npm test
npm run validate
```

当前测试后端仍是 `http://101.126.22.17:5011`，所以需要 `CAIDAZI_ALLOW_HTTP=true`。后端切到 HTTPS 后移除这个环境变量。
