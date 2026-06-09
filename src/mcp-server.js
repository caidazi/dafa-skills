import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadConfig } from "./config.js";
import { CaidaziRestClient } from "./rest-client.js";
import { createMcpTool, resultToContent } from "./tool-schema.js";

const PACKAGE_VERSION = "0.2.4";

export function createServer({ client, version = PACKAGE_VERSION }) {
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
        "Use these Caidazi MCP tools directly when they are available. Do not spawn a sub-agent, scan local skill files, start @caidazi/mcp from a command line, or handwrite JSON-RPC to answer a user query. For a single asset quote/latest price/change/volume/amount, call get_real_time_record directly and stop. Use get_asset_overview only for research or explanation, not for pure quote lookup. For multi-asset comparison, call compare_assets with canonical arguments symbols, metrics, and period; supported metrics are price, valuation, capital, and overview. Do not use assets or dimensions as compare_assets arguments. Caidazi tools provide market pulse, real-time asset quotes, asset research, capital-flow analysis, technical analysis, financial analysis, valuation analysis, stock screening, fund/ETF research, macro analysis, finance search, user assets, and portfolio review.",
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
      return {
        content: resultToContent(result),
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

export async function runStdioServer({ env = process.env, argv = process.argv.slice(2) } = {}) {
  const config = loadConfig({ env, argv });
  const client = new CaidaziRestClient(config);
  const server = createServer({ client, version: process.env.npm_package_version || PACKAGE_VERSION });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
