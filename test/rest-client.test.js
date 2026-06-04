import assert from "node:assert/strict";
import test from "node:test";

import { CaidaziRestClient, redactSecret } from "../src/rest-client.js";

test("lists tools from the REST registry", async () => {
  const requests = [];
  const client = new CaidaziRestClient({
    baseUrl: "http://example.test",
    apiKey: "test_api_key",
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse({ tools: [{ name: "extract_assets" }], total: 1 });
    },
  });

  const tools = await client.listTools();

  assert.deepEqual(tools, [{ name: "extract_assets" }]);
  assert.equal(requests[0].url, "http://example.test/api/tools/registered");
  assert.equal(requests[0].init.method, "GET");
});

test("filters registered tools to the public package allowlist", async () => {
  const client = new CaidaziRestClient({
    baseUrl: "http://example.test",
    apiKey: "test_api_key",
    fetchImpl: async () =>
      jsonResponse({
        tools: [
          { name: "extract_assets" },
          { name: "internal_raw_database_query" },
          { name: "get_caidazi_positions_summary" },
        ],
        total: 3,
      }),
  });

  const tools = await client.listTools();

  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["extract_assets", "get_caidazi_positions_summary"],
  );
});

test("calls tools through the REST bridge with bearer auth", async () => {
  const requests = [];
  const client = new CaidaziRestClient({
    baseUrl: "http://example.test/",
    apiKey: "test_api_key",
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse({
        success: true,
        tool_name: "extract_assets",
        execution_time_ms: 12,
        result: { assets: [] },
      });
    },
  });

  const result = await client.callTool("extract_assets", { text: "贵州茅台" });

  assert.deepEqual(result, { assets: [] });
  assert.equal(requests[0].url, "http://example.test/api/tools/call");
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.headers.Authorization, "Bearer test_api_key");
  assert.equal(
    requests[0].init.body,
    JSON.stringify({
      tool_name: "extract_assets",
      parameters: { text: "贵州茅台" },
    }),
  );
});

test("rejects calls to tools outside the public package allowlist", async () => {
  const client = new CaidaziRestClient({
    baseUrl: "http://example.test",
    apiKey: "test_api_key",
    fetchImpl: async () => {
      throw new Error("should not reach backend");
    },
  });

  await assert.rejects(
    () => client.callTool("internal_raw_database_query", {}),
    /not exposed by @caidazi\/mcp/,
  );
});

test("redacts API keys from surfaced errors", async () => {
  const client = new CaidaziRestClient({
    baseUrl: "http://example.test",
    apiKey: "test_api_key",
    fetchImpl: async () => textResponse(500, "upstream saw test_api_key"),
  });

  await assert.rejects(
    () => client.callTool("extract_assets", {}),
    /upstream saw \[REDACTED\]/,
  );
});

test("redacts Caidazi secrets in arbitrary text", () => {
  const fakeLiveKey = `cdz_live_${"abc123"}`;

  assert.equal(
    redactSecret(`bad ${fakeLiveKey} token`, fakeLiveKey),
    "bad [REDACTED] token",
  );
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map([["content-type", "application/json"]]),
    async text() {
      return JSON.stringify(body);
    },
    async json() {
      return body;
    },
  };
}

function textResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map([["content-type", "text/plain"]]),
    async text() {
      return body;
    },
  };
}
