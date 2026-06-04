import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ALLOWED_TOOL_NAMES } from "../src/allowed-tools.js";

test("MCP allowlist matches manifest public and account tools", () => {
  const manifest = readFileSync("manifest.yaml", "utf8");
  const manifestTools = extractToolList(manifest, "public_tools").concat(
    extractToolList(manifest, "account_tools"),
  );

  assert.deepEqual([...ALLOWED_TOOL_NAMES].sort(), manifestTools.sort());
});

function extractToolList(manifest, key) {
  const lines = manifest.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  const tools = [];

  for (const line of lines.slice(start + 1)) {
    if (/^  [a-zA-Z_]+:/.test(line)) {
      break;
    }

    const match = line.match(/^\s+-\s+([a-zA-Z0-9_]+)/);
    if (match) {
      tools.push(match[1]);
    }
  }

  return tools;
}
