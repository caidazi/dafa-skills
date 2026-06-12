import assert from "node:assert/strict";
import test from "node:test";

import {
  createMcpTool,
  parseInputDetailToSchema,
  resultToContent,
} from "../src/tool-schema.js";

test("parses markdown input detail into a JSON schema", () => {
  const schema = parseInputDetailToSchema(`| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| \`symbols\` | array[string] | 是 | 待对比的资产代码列表 |
| \`period\` | string | 否 | 对比周期 |
`);

  assert.deepEqual(schema, {
    type: "object",
    properties: {
      symbols: {
        type: "array",
        items: { type: "string" },
        description: "待对比的资产代码列表",
      },
      period: {
        type: "string",
        description: "对比周期",
      },
    },
    required: ["symbols"],
    additionalProperties: true,
  });
});

test("ignores explicit no-parameter rows", () => {
  const schema = parseInputDetailToSchema(`| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无参数 | | | 直接调用即可获取当前实时行情总结 |
`);

  assert.deepEqual(schema, {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: true,
  });
});

test("creates MCP tool metadata from registry records", () => {
  const tool = createMcpTool({
    name: "get_asset_overview",
    description: "获取资产概览",
    input_detail: "| 参数 | 类型 | 必填 | 说明 |\n|------|------|------|------|\n| `symbol` | string | 是 | 股票代码 |\n",
  });

  assert.equal(tool.name, "get_asset_overview");
  assert.equal(tool.description, "获取资产概览");
  assert.deepEqual(tool.inputSchema.required, ["symbol"]);
  assert.equal(tool.inputSchema.properties.symbol.type, "string");
});

test("adds Caidazi account boundaries to account-scoped tool descriptions", () => {
  const tool = createMcpTool({
    name: "add_caidazi_watchlist",
    description: "添加标的到财搭子自选池。",
    input_detail: "| 参数 | 类型 | 必填 | 说明 |\n|------|------|------|------|\n| `ts_codes` | string | 是 | 股票代码 |\n",
  });

  assert.match(tool.description, /财搭子 App 自选池/);
  assert.match(tool.description, /不用于其他平台自选、持仓或交易/);
});

test("does not duplicate Caidazi account boundaries already present in registry descriptions", () => {
  const description = "仅向当前 API Key 绑定的财搭子 App 自选池添加标的，不用于其他平台自选、持仓或交易。";
  const tool = createMcpTool({
    name: "add_caidazi_watchlist",
    description,
    input_detail: "| 参数 | 类型 | 必填 | 说明 |\n|------|------|------|------|\n| `ts_codes` | string | 是 | 股票代码 |\n",
  });

  assert.equal(tool.description, description);
  assert.doesNotMatch(tool.description, /边界：/);
});

test("formats tool results as MCP text content without losing structure", () => {
  assert.deepEqual(resultToContent("plain text"), [
    { type: "text", text: "plain text" },
  ]);

  assert.deepEqual(resultToContent({ ok: true, value: 1 }), [
    { type: "text", text: "{\n  \"ok\": true,\n  \"value\": 1\n}" },
  ]);
});

test("adds update notices to structured MCP results", () => {
  assert.deepEqual(resultToContent({ ok: true }, { update: { latest: "9.9.9" } }), [
    {
      type: "text",
      text: "{\n  \"ok\": true,\n  \"_notice\": {\n    \"update\": {\n      \"latest\": \"9.9.9\"\n    }\n  }\n}",
    },
  ]);
});
