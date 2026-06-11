import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("stdio MCP bridge exposes REST-backed tools", async () => {
  const backend = await createFakeBackend();
  const client = new Client(
    {
      name: "caidazi-test-client",
      version: "0.0.0",
    },
    {
      capabilities: {},
    },
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["./bin/caidazi-mcp.js"],
    cwd: process.cwd(),
    env: {
      CAIDAZI_API_KEY: "test_api_key",
      CAIDAZI_BASE_URL: backend.baseUrl,
      CAIDAZI_ALLOW_HTTP: "true",
      CAIDAZI_MCP_NO_UPDATE_NOTIFIER: "1",
    },
    stderr: "pipe",
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();

    assert.deepEqual(
      listed.tools.map((tool) => tool.name),
      ["extract_assets"],
    );

    const result = await client.callTool({
      name: "extract_assets",
      arguments: { text: "贵州茅台" },
    });

    assert.equal(result.isError, undefined);
    assert.equal(result.content[0].type, "text");
    assert.match(result.content[0].text, /贵州茅台/);
    assert.equal(backend.calls[0].headers.authorization, "Bearer test_api_key");
    assert.deepEqual(backend.calls[0].body, {
      tool_name: "extract_assets",
      parameters: { text: "贵州茅台" },
    });
  } finally {
    await transport.close();
    await backend.close();
  }
});

async function createFakeBackend() {
  const calls = [];
  const server = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/api/tools/registered") {
      respondJson(response, {
        tools: [
          {
            name: "extract_assets",
            description: "识别资产",
            input_detail:
              "| 参数 | 类型 | 必填 | 说明 |\n|------|------|------|------|\n| `text` | string | 是 | 用户输入 |\n",
          },
        ],
        total: 1,
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/tools/call") {
      const body = JSON.parse(await readBody(request));
      calls.push({
        headers: request.headers,
        body,
      });
      respondJson(response, {
        success: true,
        tool_name: body.tool_name,
        execution_time_ms: 1,
        result: {
          assets: [{ name: "贵州茅台", symbol: "600519.SH" }],
        },
      });
      return;
    }

    response.statusCode = 404;
    response.end("not found");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function respondJson(response, body) {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}
