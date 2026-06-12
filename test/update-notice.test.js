import assert from "node:assert/strict";
import test from "node:test";

import {
  getUpdateNotice,
  isNewerVersion,
  resetUpdateNoticeCache,
  shouldSkipUpdateNotice,
} from "../src/update-notice.js";

test("compares npm-style semver versions", () => {
  assert.equal(isNewerVersion("0.2.9", "0.2.8"), true);
  assert.equal(isNewerVersion("0.3.0", "0.2.9"), true);
  assert.equal(isNewerVersion("0.2.8", "0.2.8"), false);
  assert.equal(isNewerVersion("0.2.7", "0.2.8"), false);
  assert.equal(isNewerVersion("1.0.0", "1.0.0-rc.1"), true);
  assert.equal(isNewerVersion("1.0.0-rc.2", "1.0.0-rc.1"), true);
});

test("skips update notices for CI, opt-out, and non-release versions", () => {
  assert.equal(shouldSkipUpdateNotice("0.2.8", { CI: "true" }), true);
  assert.equal(shouldSkipUpdateNotice("0.2.8", { CAIDAZI_MCP_NO_UPDATE_NOTIFIER: "1" }), true);
  assert.equal(shouldSkipUpdateNotice("dev", {}), true);
  assert.equal(shouldSkipUpdateNotice("0.2.8", {}), false);
});

test("returns an update notice when npm latest is newer", async () => {
  resetUpdateNoticeCache();
  const notice = await getUpdateNotice({
    currentVersion: "0.2.8",
    env: { CAIDAZI_MCP_HOST: "codex" },
    now: () => 1000,
    fetchImpl: async () => jsonResponse({ version: "0.2.9" }),
  });

  assert.deepEqual(notice, {
    update: {
      current: "0.2.8",
      latest: "0.2.9",
      message: "财搭子 MCP 0.2.9 已发布，当前 0.2.8。请在本轮任务完成后更新，然后刷新 MCP 工具列表或新建 session。",
      command: "npx -y @caidazi/mcp@latest install --host codex",
    },
  });
});

test("does not return an update notice when current is latest", async () => {
  resetUpdateNoticeCache();
  const notice = await getUpdateNotice({
    currentVersion: "0.2.8",
    env: {},
    now: () => 1000,
    fetchImpl: async () => jsonResponse({ version: "0.2.8" }),
  });

  assert.equal(notice, null);
});

test("caches failed npm latest checks within the TTL", async () => {
  resetUpdateNoticeCache();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse({}, false);
  };

  assert.equal(
    await getUpdateNotice({ currentVersion: "0.2.8", env: {}, now: () => 1000, fetchImpl }),
    null,
  );
  assert.equal(
    await getUpdateNotice({ currentVersion: "0.2.8", env: {}, now: () => 2000, fetchImpl }),
    null,
  );
  assert.equal(calls, 1);
});

function jsonResponse(body, ok = true) {
  return {
    ok,
    async json() {
      return body;
    },
  };
}
