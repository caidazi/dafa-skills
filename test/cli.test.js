import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("validate --probe lists tools and runs the smoke-safe probe", async () => {
  const backend = await createFakeBackend();

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["./bin/caidazi-mcp.js", "validate", "--probe"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          CAIDAZI_API_KEY: "test_api_key",
          CAIDAZI_BASE_URL: backend.baseUrl,
          CAIDAZI_ALLOW_HTTP: "true",
        },
      },
    );

    assert.match(stdout, /Caidazi backend reachable: 2 public tools exposed/);
    assert.match(stdout, /- extract_assets/);
    assert.match(stdout, /- get_real_time_record/);
    assert.match(stdout, /Probe extract_assets succeeded:/);
  } finally {
    await backend.close();
  }
});

async function createFakeBackend() {
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
          {
            name: "get_real_time_record",
            description: "获取证券实时行情数据",
            input_detail:
              "| 参数 | 类型 | 必填 | 说明 |\n|------|------|------|------|\n| `symbol` | string | 是 | 证券代码 |\n",
          },
        ],
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/tools/call") {
      respondJson(response, {
        success: true,
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
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function respondJson(response, body) {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
