# Caidazi Skills and MCP

Public skills and MCP bridge for 财搭子 (Caidazi), an AI investment assistant for Chinese retail investors.

- `@caidazi/mcp` exposes Caidazi tools through standard stdio MCP.
- `caidazi-*` skills tell an Agent when to use the tools and how to present results.
- Tool logic, market data, scoring, and account access stay on the Caidazi backend.

Use `CAIDAZI_API_KEY` for authentication.

## Quick Install

Ask your Agent:

```text
Install Caidazi Skills and MCP from https://github.com/caidazi/dafa-skills.

Use manifest.yaml as the source of truth.
Configure the caidazi MCP server with stdio:
  command: npx
  args: -y @caidazi/mcp

Set CAIDAZI_API_KEY through your secure secret/env flow. Do not print it or write it into the repo.

For the current test environment, set:
  CAIDAZI_BASE_URL=http://101.126.22.17:5011
  CAIDAZI_ALLOW_HTTP=true

After installation, verify MCP tools/list can see the public tools in manifest.yaml.
Use only smoke_safe_tools for smoke tests; do not read my watchlist, positions, or portfolio unless I explicitly ask.
```

## MCP Config Shape

Use your Agent's documented MCP configuration location. The server shape is:

```json
{
  "mcpServers": {
    "caidazi": {
      "command": "npx",
      "args": ["-y", "@caidazi/mcp"],
      "env": {
        "CAIDAZI_API_KEY": "<secure secret/env reference>",
        "CAIDAZI_BASE_URL": "http://101.126.22.17:5011",
        "CAIDAZI_ALLOW_HTTP": "true"
      }
    }
  }
}
```

`CAIDAZI_ALLOW_HTTP=true` is only for the current trusted test backend. Remove it when the backend is HTTPS.

## Verify

```bash
npx -y @caidazi/mcp --help
CAIDAZI_API_KEY=<redacted> CAIDAZI_BASE_URL=http://101.126.22.17:5011 CAIDAZI_ALLOW_HTTP=true npx -y @caidazi/mcp validate
```

Expected result: the bridge reports backend reachability and lists the public Caidazi tools.

For local development:

```bash
npm install
npm test
CAIDAZI_API_KEY=<redacted> CAIDAZI_BASE_URL=http://101.126.22.17:5011 CAIDAZI_ALLOW_HTTP=true npm run validate
```

## API Key

Get your API key in the Caidazi app:

1. Open the Caidazi app.
2. Go to the 大发 agent page.
3. Tap the skill icon in the top-left corner.
4. Open Skills and copy the API key.

Never paste the full API key into chat, logs, screenshots, issues, PRs, or project files.

## What It Can Do

Public tools:

- Market pulse: market hotspots, sector moves, and market summaries.
- Asset research: stocks, ETFs, funds, indexes, and comparison.
- Stock screening: natural-language candidate discovery.
- Finance search: news, filings, research, policy, and event context.
- Fund and ETF research: ETF holdings, related ETFs, and fund comparisons.
- Macro research: policy, rates, inflation, FX, and cross-asset impact.

Account tools require an API key bound to a Caidazi account and should only run when the user explicitly asks:

- Watchlist, positions, and portfolio snapshots.
- Lightweight portfolio review.

## Safety

- Do not expose API keys, internal table names, raw backend prompts, or scoring rules.
- Do not treat the test REST backend as an Agent-facing MCP endpoint; Agent-facing MCP is stdio through `@caidazi/mcp`.
- Do not fabricate market data, filings, research, macro data, or user assets.
- Do not present outputs as guaranteed returns or deterministic buy/sell advice.
- Do not read account tools during installation smoke tests.
