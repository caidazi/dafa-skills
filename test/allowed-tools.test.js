import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ALLOWED_TOOL_NAMES, ALLOWED_TOOL_SET } from "../src/allowed-tools.js";

const EXPECTED_TOOL_NAMES = [
  "extract_assets",
  "get_hot_report",
  "get_real_time_market_summary",
  "get_market_analysis",
  "get_macro_analysis",
  "get_asset_overview",
  "get_real_time_record",
  "analyze_capital_flow",
  "analyze_technical",
  "analyze_fundamentals_financial",
  "analyze_fundamentals_valuation",
  "investment_search_pro",
  "compare_assets",
  "screen_stocks",
  "get_etf_constituents",
  "get_index_related_etfs",
  "get_stock_belongings",
  "get_caidazi_user_watchlist",
  "get_caidazi_positions_summary",
  "get_caidazi_portfolio_snapshot",
];

test("MCP allowlist includes the direct user-facing routes", () => {
  assert.deepEqual(ALLOWED_TOOL_NAMES, EXPECTED_TOOL_NAMES);
  assert.equal(new Set(ALLOWED_TOOL_NAMES).size, ALLOWED_TOOL_NAMES.length);
  assert.ok(ALLOWED_TOOL_SET.has("get_real_time_record"));
  assert.ok(ALLOWED_TOOL_SET.has("compare_assets"));
  assert.ok(ALLOWED_TOOL_SET.has("get_caidazi_user_watchlist"));
});

test("README keeps the install contract compact", () => {
  const readme = readFileSync("README.md", "utf8");

  assert.match(readme, /npx -y @caidazi\/mcp@latest install --host <当前工具>/);
  assert.match(readme, /host 可选：claude、codex、openclaw、generic/);
  assert.match(readme, /贵州茅台现在多少钱？/);
  assert.doesNotMatch(readme, /"mcpServers"\s*:/);
  assert.doesNotMatch(readme, /settings\.json/);
  assert.doesNotMatch(readme, /人工安装/);
  assert.doesNotMatch(readme, /npm test/);
});
