import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ALLOWED_TOOL_NAMES, ALLOWED_TOOL_SET } from "../src/allowed-tools.js";

const EXPECTED_TOOL_NAMES = [
  "extract_assets",
  "investment_search_pro",
  "get_asset_overview",
  "get_real_time_record",
  "get_market_analysis",
  "get_hot_report",
  "get_index_related_etfs",
  "get_etf_constituents",
  "get_stock_belongings",
  "get_real_time_market_summary",
  "get_macro_analysis",
  "analyze_caidazi_capital_flow",
  "analyze_caidazi_technical",
  "analyze_caidazi_financial",
  "analyze_caidazi_valuation",
  "compare_assets",
  "screen_stocks",
  "get_caidazi_user_watchlist",
  "add_caidazi_watchlist",
  "remove_caidazi_watchlist",
  "get_caidazi_monitor_tasks",
  "get_caidazi_positions_summary",
  "get_caidazi_portfolio_snapshot",
  "analyze_event_impact",
  "analyze_earnings_result",
  "preview_earnings",
  "get_sector_radar",
  "sector_deep_dive",
  "relative_valuation",
  "intrinsic_valuation",
  "generate_asset_report",
];

test("MCP allowlist includes the direct user-facing routes", () => {
  assert.deepEqual(ALLOWED_TOOL_NAMES, EXPECTED_TOOL_NAMES);
  assert.equal(new Set(ALLOWED_TOOL_NAMES).size, ALLOWED_TOOL_NAMES.length);
  assert.ok(ALLOWED_TOOL_SET.has("get_real_time_record"));
  assert.ok(ALLOWED_TOOL_SET.has("compare_assets"));
  assert.ok(ALLOWED_TOOL_SET.has("get_caidazi_user_watchlist"));
  assert.ok(ALLOWED_TOOL_SET.has("add_caidazi_watchlist"));
  assert.ok(ALLOWED_TOOL_SET.has("remove_caidazi_watchlist"));
  assert.ok(ALLOWED_TOOL_SET.has("get_caidazi_monitor_tasks"));
  assert.equal(ALLOWED_TOOL_SET.has("add_watchlist"), false);
  assert.equal(ALLOWED_TOOL_SET.has("remove_watchlist"), false);
  assert.equal(ALLOWED_TOOL_SET.has("get_monitor_tasks"), false);
});

test("README keeps the install contract compact", () => {
  const readme = readFileSync("README.md", "utf8");

  assert.match(readme, /npx -y @caidazi\/mcp@latest install --host <当前工具>/);
  assert.match(readme, /host 可选：claude、codex、openclaw、generic/);
  assert.match(readme, /贵州茅台现在多少钱？/);
  assert.match(readme, /每次执行时直接调用财搭子 MCP 工具/);
  assert.match(readme, /分析表达参考已安装的 caidazi skills/);
  assert.match(readme, /不要用网页搜索、通用行情源、bash\/npx 或本地脚本替代财搭子 MCP/);
  assert.match(readme, /不是创建或修改财搭子 App 监控任务/);
  assert.match(readme, /get_caidazi_monitor_tasks/);
  assert.doesNotMatch(readme, /"mcpServers"\s*:/);
  assert.doesNotMatch(readme, /settings\.json/);
  assert.doesNotMatch(readme, /人工安装/);
  assert.doesNotMatch(readme, /npm test/);
});

test("waiting discipline copy stays plain and non-promissory", () => {
  const docs = [
    "README.md",
    "src/mcp-server.js",
    "caidazi-asset-research/SKILL.md",
    "caidazi-stock-screener/SKILL.md",
  ].map((path) => readFileSync(path, "utf8")).join("\n");

  for (const phrase of [
    "支持判断的信息",
    "观察信号",
    "反证条件",
    "继续观察理由",
    "候选观察池",
  ]) {
    assert.match(docs, new RegExp(phrase));
  }

  for (const forbidden of [
    "λ",
    "状态跳变",
    "review clock",
    "复盘时钟",
    "证据网络",
    "买点",
    "卖点",
    "高胜率",
    "稳赚",
  ]) {
    assert.doesNotMatch(docs, new RegExp(forbidden));
  }
});
