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

test("formats tool results as MCP text content without losing structure", () => {
  assert.deepEqual(resultToContent("plain text"), [
    { type: "text", text: "plain text" },
  ]);

  assert.deepEqual(resultToContent({ ok: true, value: 1 }), [
    { type: "text", text: "{\n  \"ok\": true,\n  \"value\": 1\n}" },
  ]);
});
