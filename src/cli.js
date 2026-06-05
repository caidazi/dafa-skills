import { loadConfig } from "./config.js";
import { runStdioServer } from "./mcp-server.js";
import { CaidaziRestClient } from "./rest-client.js";

const HELP = `Caidazi MCP bridge

Usage:
  caidazi-mcp                    Start the stdio MCP server
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

  await runStdioServer({ argv, env });
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
