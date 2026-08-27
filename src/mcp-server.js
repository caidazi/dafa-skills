import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadConfig } from "./config.js";
import { CaidaziRestClient } from "./rest-client.js";
import { createMcpTool, resultToContent } from "./tool-schema.js";
import { getUpdateNotice } from "./update-notice.js";

const PACKAGE_VERSION = "0.2.10";

export function createServer({
  client,
  version = PACKAGE_VERSION,
  env = process.env,
  updateNotice = getUpdateNotice,
}) {
  const server = new Server(
    {
      name: "caidazi",
      version,
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        "Use these Caidazi MCP tools directly when they are available. Do not spawn a sub-agent, scan local skill files, start @caidazi/mcp from a command line, or handwrite JSON-RPC to answer a user query. For a single asset quote/latest price/change/volume/amount, call get_real_time_record directly and stop. For the latest A-share one-minute bar with market status and delay, call get_a_share_realtime_1m_price. For a fixed two-trading-day A-share minute series, including batch symbols, call get_a_share_history_1m_price. Use get_asset_overview only for research or explanation, not for pure quote lookup. For multi-asset comparison, call compare_assets with canonical arguments symbols, metrics, and period; supported metrics are price, valuation, capital, and overview. Do not use assets or dimensions as compare_assets arguments. If a tool result includes _notice.update or a text block titled 财搭子 MCP/Skills 更新提醒, include that update reminder briefly at the end of your final answer. Caidazi account tools only read or operate on the Caidazi App account, Caidazi watchlist pool, and existing Caidazi monitor tasks bound to the configured API key. Caidazi tools provide market pulse, real-time asset quotes, A-share minute prices, asset research, capital-flow analysis, technical analysis, financial analysis, valuation analysis, stock screening, fund/ETF research, macro analysis, finance search, user watchlist/positions/portfolio context, explicit watchlist add/remove, existing monitor-task lookup, and portfolio review. Use tool results to identify observation signals, event clues, and disconfirming conditions; do not turn short-term market moves into deterministic state changes, and do not force trading-like actions when there is no new information.",
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await client.listTools();
    return {
      tools: tools.map(createMcpTool),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const parameters = request.params.arguments || {};

    try {
      const result = await client.callTool(toolName, parameters);
      const notice = await safeUpdateNotice(updateNotice, { currentVersion: version, env });
      return {
        content: resultToContent(result, notice),
      };
    } catch (error) {
      return {
        isError: true,
        content: resultToContent(error instanceof Error ? error.message : String(error)),
      };
    }
  });

  return server;
}

async function safeUpdateNotice(updateNotice, options) {
  try {
    return await updateNotice(options);
  } catch {
    return null;
  }
}

export async function runStdioServer({ env = process.env, argv = process.argv.slice(2) } = {}) {
  const config = loadConfig({ env, argv });
  const client = new CaidaziRestClient(config);
  const server = createServer({
    client,
    version: env.npm_package_version || PACKAGE_VERSION,
    env,
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
