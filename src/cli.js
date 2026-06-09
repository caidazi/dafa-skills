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
const DEFAULT_BASE_URL = "http://101.126.22.17:5011";

const HELP = `Caidazi MCP bridge

Usage:
  caidazi-mcp                    Start the stdio MCP server
  caidazi-mcp install --host <claude|codex>
                                  Install Caidazi skills and register MCP
  caidazi-mcp validate [--probe] Validate backend reachability

Environment:
  CAIDAZI_API_KEY       Required bearer token
  CAIDAZI_BASE_URL      Optional backend base URL (default: http://101.126.22.17:5011)
  CAIDAZI_ALLOW_HTTP    Required as "true" when CAIDAZI_BASE_URL uses http://
  CAIDAZI_TIMEOUT_MS    Optional request timeout in milliseconds (default: 30000)
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

  if (!options.skipSkills) {
    await installSkills(skillsDir);
    process.stdout.write(`Installed Caidazi skills to ${skillsDir}\n`);
  }

  if (!options.skipMcp) {
    const apiKey = env.CAIDAZI_API_KEY;
    if (!apiKey) {
      throw new Error("CAIDAZI_API_KEY is required in the environment before registering MCP.");
    }

    const baseUrl = env.CAIDAZI_BASE_URL || DEFAULT_BASE_URL;
    const allowHttp = env.CAIDAZI_ALLOW_HTTP || (baseUrl.startsWith("http://") ? "true" : undefined);
    await registerMcp({ host, apiKey, baseUrl, allowHttp });
  }

  process.stdout.write("Caidazi install finished. If the current Agent session cannot see caidazi tools yet, start a new session.\n");
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
    throw new Error("Missing --host. Use --host claude or --host codex.");
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
  throw new Error(`Unsupported host: ${host}. Use claude or codex.`);
}

function defaultSkillsDir(host, env) {
  if (host === "claude") {
    return join(homedir(), ".claude", "skills");
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
      "-e",
      `CAIDAZI_API_KEY=${apiKey}`,
      "-e",
      `CAIDAZI_BASE_URL=${baseUrl}`,
      "-e",
      `CAIDAZI_ALLOW_HTTP=${allowHttp || ""}`,
      "--",
      "npx",
      "-y",
      "@caidazi/mcp@latest",
    ], apiKey);
    process.stdout.write("Registered caidazi MCP with Claude Code.\n");
    return;
  }

  await runHostCommandAllowFailure("codex", ["mcp", "remove", "caidazi"]);
  await runHostCommand("codex", [
    "mcp",
    "add",
    "caidazi",
    "--env",
    `CAIDAZI_API_KEY=${apiKey}`,
    "--env",
    `CAIDAZI_BASE_URL=${baseUrl}`,
    "--env",
    `CAIDAZI_ALLOW_HTTP=${allowHttp || ""}`,
    "--",
    "npx",
    "-y",
    "@caidazi/mcp@latest",
  ], apiKey);
  process.stdout.write("Registered caidazi MCP with Codex.\n");
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
