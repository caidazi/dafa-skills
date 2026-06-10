import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../src/config.js";

test("loads default backend bridge config from environment", () => {
  const config = loadConfig({
    env: {
      CAIDAZI_API_KEY: "test_api_key",
    },
    argv: [],
  });

  assert.equal(config.apiKey, "test_api_key");
  assert.equal(config.baseUrl, "https://mcp.zhicepilot.com");
  assert.equal(config.timeoutMs, 30000);
});

test("allows overriding base URL and timeout", () => {
  const config = loadConfig({
    env: {
      CAIDAZI_API_KEY: "test_api_key",
      CAIDAZI_BASE_URL: "https://example.com/",
      CAIDAZI_TIMEOUT_MS: "5000",
    },
    argv: [],
  });

  assert.equal(config.baseUrl, "https://example.com");
  assert.equal(config.timeoutMs, 5000);
});

test("fails fast when API key is missing", () => {
  assert.throws(
    () => loadConfig({ env: {}, argv: [] }),
    /CAIDAZI_API_KEY is required/,
  );
});

test("requires explicit opt-in before using a plain HTTP backend", () => {
  assert.throws(
    () =>
      loadConfig({
        env: {
          CAIDAZI_API_KEY: "test_api_key",
          CAIDAZI_BASE_URL: "http://example.test",
        },
        argv: [],
      }),
    /CAIDAZI_ALLOW_HTTP=true/,
  );
});
