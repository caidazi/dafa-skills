import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("install copies skills and registers Claude MCP through the host CLI", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "caidazi-install-"));
  const binDir = join(tmp, "bin");
  const skillsDir = join(tmp, "skills");
  const logPath = join(tmp, "claude.log");

  await mkdir(binDir, { recursive: true });
  await writeFile(
    join(binDir, "claude"),
    `#!/bin/sh\nprintf '%s\\n' "$*" > "${logPath}"\n`,
    { mode: 0o755 },
  );

  const { stdout } = await execFileAsync(
    process.execPath,
    ["./bin/caidazi-mcp.js", "install", "--host", "claude", "--skills-dir", skillsDir],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        CAIDAZI_API_KEY: "test_api_key",
        CAIDAZI_BASE_URL: "http://127.0.0.1:5011",
        CAIDAZI_ALLOW_HTTP: "true",
      },
    },
  );

  assert.match(stdout, /Installed Caidazi skills/);
  assert.match(stdout, /Registered caidazi MCP with Claude Code/);
  await stat(join(skillsDir, "caidazi-asset-research", "SKILL.md"));

  const logged = await readFile(logPath, "utf8");
  assert.match(logged, /mcp add --scope user caidazi/);
  assert.match(logged, /CAIDAZI_API_KEY=test_api_key/);
  assert.match(logged, /npx -y @caidazi\/mcp@latest/);
});

test("install registers OpenClaw MCP through the host CLI", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "caidazi-openclaw-install-"));
  const binDir = join(tmp, "bin");
  const skillsDir = join(tmp, "skills");
  const logPath = join(tmp, "openclaw.log");

  await mkdir(binDir, { recursive: true });
  await writeFile(
    join(binDir, "openclaw"),
    `#!/bin/sh\nprintf '%s\\n' "$*" > "${logPath}"\n`,
    { mode: 0o755 },
  );

  const { stdout } = await execFileAsync(
    process.execPath,
    ["./bin/caidazi-mcp.js", "install", "--host", "openclaw", "--skills-dir", skillsDir],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        CAIDAZI_API_KEY: "test_api_key",
        CAIDAZI_BASE_URL: "http://127.0.0.1:5011",
        CAIDAZI_ALLOW_HTTP: "true",
      },
    },
  );

  assert.match(stdout, /Registered caidazi MCP with OpenClaw/);
  await stat(join(skillsDir, "caidazi-asset-research", "SKILL.md"));

  const logged = await readFile(logPath, "utf8");
  assert.match(logged, /mcp add caidazi --command npx/);
  assert.match(logged, /--arg -y --arg @caidazi\/mcp@latest/);
  assert.match(logged, /--env CAIDAZI_API_KEY=test_api_key/);
});

test("install registers Codex MCP through the host CLI", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "caidazi-codex-install-"));
  const binDir = join(tmp, "bin");
  const skillsDir = join(tmp, "skills");
  const logPath = join(tmp, "codex.log");

  await mkdir(binDir, { recursive: true });
  await writeFile(
    join(binDir, "codex"),
    `#!/bin/sh\nprintf '%s\\n' "$*" > "${logPath}"\n`,
    { mode: 0o755 },
  );

  const { stdout } = await execFileAsync(
    process.execPath,
    ["./bin/caidazi-mcp.js", "install", "--host", "codex", "--skills-dir", skillsDir],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        CAIDAZI_API_KEY: "test_api_key",
        CAIDAZI_BASE_URL: "",
        CAIDAZI_ALLOW_HTTP: "",
      },
    },
  );

  assert.match(stdout, /Registered caidazi MCP with Codex/);
  await stat(join(skillsDir, "caidazi-asset-research", "SKILL.md"));

  const logged = await readFile(logPath, "utf8");
  assert.match(logged, /mcp add caidazi --env CAIDAZI_API_KEY=test_api_key/);
  assert.match(logged, /--env CAIDAZI_BASE_URL=https:\/\/mcp\.zhicepilot\.com\//);
  assert.doesNotMatch(logged, /CAIDAZI_ALLOW_HTTP/);
  assert.match(logged, /-- npx -y @caidazi\/mcp@latest/);
});

test("install fails before copying skills when HTTP opt-in is missing", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "caidazi-http-opt-in-"));
  const skillsDir = join(tmp, "skills");

  await assert.rejects(
    execFileAsync(
      process.execPath,
      ["./bin/caidazi-mcp.js", "install", "--host", "codex", "--skills-dir", skillsDir],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          CAIDAZI_API_KEY: "test_api_key",
          CAIDAZI_BASE_URL: "http://127.0.0.1:5011",
          CAIDAZI_ALLOW_HTTP: "",
        },
      },
    ),
    /Plain HTTP backend requires explicit CAIDAZI_ALLOW_HTTP=true/,
  );

  await assert.rejects(
    stat(join(skillsDir, "caidazi-asset-research", "SKILL.md")),
    /ENOENT/,
  );
});

test("generic install copies skills and prints MCP spec", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "caidazi-generic-install-"));
  const skillsDir = join(tmp, "skills");

  const { stdout } = await execFileAsync(
    process.execPath,
    ["./bin/caidazi-mcp.js", "install", "--host", "generic", "--skills-dir", skillsDir],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CAIDAZI_BASE_URL: "http://127.0.0.1:5011",
        CAIDAZI_ALLOW_HTTP: "true",
      },
    },
  );

  assert.match(stdout, /Installed Caidazi skills/);
  assert.match(stdout, /Register this stdio MCP server/);
  assert.match(stdout, /"command": "npx"/);
  assert.match(stdout, /"@caidazi\/mcp@latest"/);
  assert.doesNotMatch(stdout, /test_api_key/);
  await stat(join(skillsDir, "caidazi-asset-research", "SKILL.md"));
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
