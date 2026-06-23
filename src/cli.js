import { execFile } from "node:child_process";
import { cp, mkdir, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { loadConfig } from "./config.js";
import { runStdioServer } from "./mcp-server.js";
import { CaidaziRestClient } from "./rest-client.js";

const execFileAsync = promisify(execFile);
const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_BASE_URL = "https://mcp.zhicepilot.com/";

const HELP = `Caidazi MCP bridge

Usage:
  caidazi-mcp                    Start the stdio MCP server
  caidazi-mcp install --host <claude|codex|openclaw|generic>
                                  Install Caidazi skills and register MCP
  caidazi-mcp validate [--probe] Validate backend reachability

Environment:
  CAIDAZI_API_KEY       Required bearer token
  CAIDAZI_BASE_URL      Optional backend base URL (default: https://mcp.zhicepilot.com/)
  CAIDAZI_ALLOW_HTTP    Required only when CAIDAZI_BASE_URL uses http://
  CAIDAZI_TIMEOUT_MS    Optional request timeout in milliseconds (default: 30000)
  CAIDAZI_MCP_NO_UPDATE_NOTIFIER
                        Optional opt-out for update notices in MCP results
`;

export async function main({ argv = process.argv.slice(2), env = process.env } = {}) {
  const [command, ...rest] = argv;

  if (command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(HELP);
    return;
  }

  if (command === "validate") {
    await validate({ argv: rest, env });
    return;
  }

  if (command === "install") {
    await install({ argv: rest, env });
    return;
  }

  await runStdioServer({ argv, env });
}

async function install({ argv, env }) {
  const options = parseInstallArgs(argv);
  const host = normalizeHost(options.host);
  const skillsDir = options.skillsDir || defaultSkillsDir(host, env);
  const mcpConfig = !options.skipMcp && host !== "generic"
    ? readMcpRegistrationConfig(env)
    : null;

  if (!options.skipSkills) {
    await installSkills(skillsDir);
    process.stdout.write(`Installed Caidazi skills to ${skillsDir}\n`);
  }

  if (!options.skipMcp && host === "generic") {
    printGenericMcpSpec(env);
  } else if (!options.skipMcp) {
    await registerMcp({ host, ...mcpConfig });
  }

  process.stdout.write("Caidazi install finished. You can now ask for quotes, market pulse, asset research, stock screening, finance search, watchlist/positions/portfolio context, watchlist add/remove, and existing monitor tasks.\n");
  process.stdout.write("If the current Agent session cannot see caidazi tools yet, reload MCP or start a new session, then verify with: 贵州茅台现在多少钱？\n");
  process.stdout.write(recurringTaskOnboarding(host));
}

function readMcpRegistrationConfig(env) {
  const apiKey = env.CAIDAZI_API_KEY;
  if (!apiKey) {
    throw new Error("CAIDAZI_API_KEY is required in the environment before registering MCP.");
  }

  const baseUrl = env.CAIDAZI_BASE_URL || DEFAULT_BASE_URL;
  const allowHttp = env.CAIDAZI_ALLOW_HTTP;
  if (baseUrl.startsWith("http://") && allowHttp !== "true") {
    throw new Error("Plain HTTP backend requires explicit CAIDAZI_ALLOW_HTTP=true before registering MCP.");
  }

  return { apiKey, baseUrl, allowHttp };
}

function parseInstallArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const rawName = arg.slice(2);
    const name = rawName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

    if (["skipSkills", "skipMcp"].includes(name)) {
      options[name] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${rawName}`);
    }

    options[name] = value;
    index += 1;
  }

  if (!options.host) {
    throw new Error("Missing --host. Use claude, codex, openclaw, or generic.");
  }

  return options;
}

function normalizeHost(host) {
  const normalized = String(host).toLowerCase();
  if (["claude", "claude-code", "claude_code"].includes(normalized)) {
    return "claude";
  }
  if (["codex", "codex-cli", "codex_cli"].includes(normalized)) {
    return "codex";
  }
  if (["openclaw", "open-claw", "open_claw"].includes(normalized)) {
    return "openclaw";
  }
  if (["generic", "other"].includes(normalized)) {
    return "generic";
  }
  throw new Error(`Unsupported host: ${host}. Use claude, codex, openclaw, or generic.`);
}

function defaultSkillsDir(host, env) {
  if (host === "claude") {
    return join(homedir(), ".claude", "skills");
  }

  if (host === "openclaw") {
    return join(homedir(), ".openclaw", "skills");
  }

  if (host === "generic") {
    return join(env.AGENTS_HOME || join(homedir(), ".agents"), "skills");
  }

  return join(env.CODEX_HOME || join(homedir(), ".codex"), "skills");
}

async function installSkills(skillsDir) {
  await mkdir(skillsDir, { recursive: true });
  const entries = await readdir(PACKAGE_ROOT, { withFileTypes: true });
  const skillDirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("caidazi-"))
    .map((entry) => entry.name);

  for (const skillDir of skillDirs) {
    await cp(join(PACKAGE_ROOT, skillDir), join(skillsDir, skillDir), {
      recursive: true,
      force: true,
    });
  }
}

async function registerMcp({ host, apiKey, baseUrl, allowHttp }) {
  if (host === "claude") {
    await runHostCommandAllowFailure("claude", ["mcp", "remove", "caidazi", "-s", "user"]);
    await runHostCommand("claude", [
      "mcp",
      "add",
      "--scope",
      "user",
      "caidazi",
      ...mcpEnvArgs("-e", { CAIDAZI_API_KEY: apiKey, CAIDAZI_BASE_URL: baseUrl, CAIDAZI_ALLOW_HTTP: allowHttp, CAIDAZI_MCP_HOST: host }),
      "--",
      "npx",
      "-y",
      "@caidazi/mcp@latest",
    ], apiKey);
    process.stdout.write("Registered caidazi MCP with Claude Code.\n");
    return;
  }

  if (host === "openclaw") {
    await runHostCommandAllowFailure("openclaw", ["mcp", "unset", "caidazi"]);
    await runHostCommand("openclaw", [
      "mcp",
      "add",
      "caidazi",
      "--command",
      "npx",
      "--arg",
      "-y",
      "--arg",
      "@caidazi/mcp@latest",
      ...mcpEnvArgs("--env", { CAIDAZI_API_KEY: apiKey, CAIDAZI_BASE_URL: baseUrl, CAIDAZI_ALLOW_HTTP: allowHttp, CAIDAZI_MCP_HOST: host }),
    ], apiKey);
    process.stdout.write("Registered caidazi MCP with OpenClaw.\n");
    return;
  }

  await runHostCommandAllowFailure("codex", ["mcp", "remove", "caidazi"]);
  await runHostCommand("codex", [
    "mcp",
    "add",
    "caidazi",
    ...mcpEnvArgs("--env", { CAIDAZI_API_KEY: apiKey, CAIDAZI_BASE_URL: baseUrl, CAIDAZI_ALLOW_HTTP: allowHttp, CAIDAZI_MCP_HOST: host }),
    "--",
    "npx",
    "-y",
    "@caidazi/mcp@latest",
  ], apiKey);
  process.stdout.write("Registered caidazi MCP with Codex.\n");
}

function printGenericMcpSpec(env) {
  const baseUrl = env.CAIDAZI_BASE_URL || DEFAULT_BASE_URL;
  const allowHttp = env.CAIDAZI_ALLOW_HTTP || "";
  const specEnv = {
    CAIDAZI_API_KEY: "<set in your Agent secret/env flow>",
    CAIDAZI_BASE_URL: baseUrl,
    CAIDAZI_MCP_HOST: "generic",
  };
  if (allowHttp) {
    specEnv.CAIDAZI_ALLOW_HTTP = allowHttp;
  }

  process.stdout.write(`Register this stdio MCP server in your Agent's official MCP settings:\n${JSON.stringify({
    name: "caidazi",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@caidazi/mcp@latest"],
    env: specEnv,
  }, null, 2)}\n`);
}

function recurringTaskOnboarding(host) {
  const capability = {
    claude: "Claude Code loop",
    codex: "Codex automation",
    openclaw: "OpenClaw recurring task/loop",
    generic: "its recurring task, automation, scheduler, or loop feature",
  }[host] || "its recurring task, automation, scheduler, or loop feature";

  return `
可选下一步：设置当前 Agent 的定时推送。
请让当前 Agent 使用 ${capability}。这一步是在 Agent 里创建定时推送，不是创建或修改财搭子 App 监控任务；如需结合已有监控任务，仅用 get_caidazi_monitor_tasks 只读查询。如果当前 session 还不能创建定时任务，请让 Agent 给出最接近的支持方案。

Suggested prompt:
请使用当前 Agent 的定时任务/automation/loop 能力，为财搭子创建以下定时推送任务：
请把以下执行约束写进每个定时任务正文：每次执行时直接调用财搭子 MCP 工具，分析表达参考已安装的 caidazi skills；不要用网页搜索、通用行情源、bash/npx 或本地脚本替代财搭子 MCP；如果 caidazi MCP 不可用，请说明无法执行并提示刷新 MCP 工具列表或新建 session。
1. 每个 A 股交易日 11:45（Asia/Shanghai）推送“自选早盘表现总结和午盘研判”：使用 get_caidazi_user_watchlist 读取我的财搭子 App 自选池，结合 get_real_time_record、get_market_analysis 和必要的标的研究工具，总结涨跌、异动、资金/技术线索、午后重点观察，不给买卖指令。
2. 每个 A 股交易日 15:30（Asia/Shanghai）推送“财搭子账户收盘表现总结”：使用 get_caidazi_positions_summary 和 get_caidazi_portfolio_snapshot 读取我的财搭子 App 持仓摘要、组合快照和自选，结合收盘行情总结账户表现、主要贡献/拖累、风险暴露和明日关注点，不输出具体交易指令。
如需结合我在财搭子 App 已有的监控任务，仅用 get_caidazi_monitor_tasks 只读查询，不创建、订阅、删除或修改监控任务。
如果当天不是交易日、接口无数据或账户未绑定，请跳过或说明原因；如果创建任务需要我确认，请先把计划给我确认。

`;
}

function mcpEnvArgs(flag, env) {
  return Object.entries(env).flatMap(([name, value]) => (
    value ? [flag, `${name}=${value}`] : []
  ));
}

async function runHostCommandAllowFailure(command, args) {
  try {
    await execFileAsync(command, args);
  } catch {
    // Idempotent install: absence of an existing server is fine.
  }
}

async function runHostCommand(command, args, secret) {
  try {
    await execFileAsync(command, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redactSecret(message, secret));
  }
}

function redactSecret(value, secret) {
  if (!secret) {
    return value;
  }

  return String(value).split(secret).join("[redacted]");
}

async function validate({ argv, env }) {
  const config = loadConfig({ argv: argv.filter((arg) => arg !== "--probe"), env });
  const client = new CaidaziRestClient(config);
  const tools = await client.listTools();

  process.stdout.write(`Caidazi backend reachable: ${tools.length} public tools exposed\n`);
  for (const tool of tools) {
    process.stdout.write(`- ${tool.name}\n`);
  }

  if (argv.includes("--probe")) {
    const result = await client.callTool("extract_assets", { text: "贵州茅台" });
    process.stdout.write(`Probe extract_assets succeeded: ${summarizeProbe(result)}\n`);
  }
}

function summarizeProbe(result) {
  if (typeof result === "string") {
    return result.slice(0, 120);
  }

  if (result && typeof result === "object") {
    return JSON.stringify(result).slice(0, 120);
  }

  return String(result);
}
