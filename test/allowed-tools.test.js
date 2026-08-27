import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("release version metadata stays synchronized", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const mcpServer = readFileSync("src/mcp-server.js", "utf8");

  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages[""].version, packageJson.version);
  assert.match(
    mcpServer,
    new RegExp(`const PACKAGE_VERSION = "${packageJson.version.replaceAll(".", "\\.")}"`),
  );
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
