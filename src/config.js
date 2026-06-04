const DEFAULT_BASE_URL = "http://101.126.22.17:5011";
const DEFAULT_TIMEOUT_MS = 30000;

export function loadConfig({ env = process.env, argv = process.argv.slice(2) } = {}) {
  const options = parseArgs(argv);
  const apiKeyEnv = options.apiKeyEnv || "CAIDAZI_API_KEY";
  const apiKey = options.apiKey || env[apiKeyEnv];

  if (!apiKey) {
    throw new Error(`${apiKeyEnv} is required. Set it in your Agent's secret or environment configuration.`);
  }

  const baseUrl = normalizeBaseUrl(
    options.baseUrl ||
      env.CAIDAZI_BASE_URL ||
      env.CAIDAZI_API_BASE_URL ||
      DEFAULT_BASE_URL,
  );
  const allowHttp = options.allowHttp === "true" || env.CAIDAZI_ALLOW_HTTP === "true";
  const timeoutMs = parsePositiveInteger(
    options.timeoutMs || env.CAIDAZI_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );

  if (baseUrl.startsWith("http://") && !allowHttp) {
    throw new Error(
      "Plain HTTP backend requires explicit CAIDAZI_ALLOW_HTTP=true because bearer tokens are sent to the backend.",
    );
  }

  return {
    apiKey,
    apiKeyEnv,
    baseUrl,
    allowHttp,
    timeoutMs,
  };
}

export function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split("=", 2);
    const name = rawName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const value = inlineValue ?? argv[index + 1];

    if (inlineValue === undefined) {
      index += 1;
    }

    if (value === undefined) {
      throw new Error(`Missing value for --${rawName}`);
    }

    options[name] = value;
  }

  return options;
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer timeout, got: ${value}`);
  }

  return parsed;
}
