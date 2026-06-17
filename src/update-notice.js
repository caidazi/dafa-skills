const NPM_LATEST_URL = "https://registry.npmjs.org/@caidazi%2fmcp/latest";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 2000;
const UPDATE_COMMAND = "npx -y @caidazi/mcp@latest install --host";

let cache = {
  checkedAt: 0,
  latest: "",
};

export async function getUpdateNotice({
  currentVersion,
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  if (shouldSkipUpdateNotice(currentVersion, env) || typeof fetchImpl !== "function") {
    return null;
  }

  const latest = await getLatestVersion({ fetchImpl, now });
  if (!latest || !isNewerVersion(latest, currentVersion)) {
    return null;
  }

  const host = normalizeHost(env.CAIDAZI_MCP_HOST);
  const command = host ? `${UPDATE_COMMAND} ${host}` : `${UPDATE_COMMAND} <当前工具>`;

  return {
    update: {
      current: currentVersion,
      latest,
      message: `财搭子 MCP/Skills ${latest} 已发布，当前 MCP ${currentVersion}。请在本轮任务完成后更新，然后刷新 MCP 工具列表或新建 session。`,
      command,
    },
  };
}

export function shouldSkipUpdateNotice(version, env = process.env) {
  if (env.CAIDAZI_MCP_NO_UPDATE_NOTIFIER) {
    return true;
  }
  if (env.CI || env.BUILD_NUMBER || env.RUN_ID) {
    return true;
  }
  return !isReleaseVersion(version);
}

export function isNewerVersion(candidate, current) {
  const candidateVersion = parseVersion(candidate);
  const currentVersion = parseVersion(current);
  if (!candidateVersion || !currentVersion) {
    return false;
  }

  for (let index = 0; index < 3; index += 1) {
    if (candidateVersion[index] > currentVersion[index]) {
      return true;
    }
    if (candidateVersion[index] < currentVersion[index]) {
      return false;
    }
  }

  return comparePrerelease(candidateVersion[3], currentVersion[3]) > 0;
}

export function resetUpdateNoticeCache() {
  cache = {
    checkedAt: 0,
    latest: "",
  };
}

async function getLatestVersion({ fetchImpl, now }) {
  const timestamp = now();
  if (cache.checkedAt && timestamp - cache.checkedAt < CACHE_TTL_MS) {
    return cache.latest;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(NPM_LATEST_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      cache = { ...cache, checkedAt: timestamp };
      return cache.latest;
    }

    const body = await response.json();
    if (typeof body.version === "string" && isReleaseVersion(body.version)) {
      cache = {
        checkedAt: timestamp,
        latest: body.version,
      };
      return body.version;
    }
    cache = { ...cache, checkedAt: timestamp };
  } catch {
    cache = { ...cache, checkedAt: timestamp };
    return cache.latest;
  } finally {
    clearTimeout(timer);
  }

  return cache.latest;
}

function isReleaseVersion(version) {
  return parseVersion(version) !== null;
}

function parseVersion(version) {
  const match = String(version || "")
    .trim()
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) {
    return null;
  }

  return [
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
    Number.parseInt(match[3], 10),
    match[4] || "",
  ];
}

function comparePrerelease(candidate, current) {
  if (candidate === current) {
    return 0;
  }
  if (!candidate) {
    return 1;
  }
  if (!current) {
    return -1;
  }

  const candidateParts = candidate.split(".");
  const currentParts = current.split(".");
  const length = Math.max(candidateParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const left = candidateParts[index];
    const right = currentParts[index];
    if (left === right) {
      continue;
    }
    if (left === undefined) {
      return -1;
    }
    if (right === undefined) {
      return 1;
    }

    const leftNumber = numericIdentifier(left);
    const rightNumber = numericIdentifier(right);
    if (leftNumber !== null && rightNumber !== null) {
      return Math.sign(leftNumber - rightNumber);
    }
    if (leftNumber !== null) {
      return -1;
    }
    if (rightNumber !== null) {
      return 1;
    }
    return left > right ? 1 : -1;
  }

  return 0;
}

function numericIdentifier(value) {
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    return null;
  }
  return Number.parseInt(value, 10);
}

function normalizeHost(value) {
  const host = String(value || "").trim().toLowerCase();
  if (["claude", "codex", "openclaw", "generic"].includes(host)) {
    return host;
  }
  return "";
}
