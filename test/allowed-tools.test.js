import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ALLOWED_TOOL_NAMES, ALLOWED_TOOL_SET } from "../src/allowed-tools.js";

test("MCP allowlist includes the direct user-facing routes", () => {
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
