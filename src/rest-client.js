import { isAllowedTool } from "./allowed-tools.js";

const DEFAULT_REGISTRY_PATH = "/api/tools/registered";
const DEFAULT_CALL_PATH = "/api/tools/call";

export class CaidaziRestClient {
  constructor({
    baseUrl,
    apiKey,
    fetchImpl = globalThis.fetch,
    timeoutMs = 30000,
    registryPath = DEFAULT_REGISTRY_PATH,
    callPath = DEFAULT_CALL_PATH,
  }) {
    if (!baseUrl) {
      throw new Error("baseUrl is required");
    }
    if (!apiKey) {
      throw new Error("apiKey is required");
    }
    if (typeof fetchImpl !== "function") {
      throw new Error("fetch implementation is required");
    }

    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.registryPath = registryPath;
    this.callPath = callPath;
  }

  async listTools() {
    const body = await this.request(this.registryPath, {
      method: "GET",
      headers: this.headers(),
    });

    if (!Array.isArray(body.tools)) {
      throw new Error("Tool registry response did not include a tools array");
    }

    return body.tools.filter((tool) => isAllowedTool(tool.name));
  }

  async callTool(toolName, parameters = {}) {
    if (!isAllowedTool(toolName)) {
      throw new Error(`Tool ${toolName} is not exposed by @caidazi/mcp`);
    }

    const body = await this.request(this.callPath, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        tool_name: toolName,
        parameters,
      }),
    });

    if (body.success === false) {
      throw new Error(body.error || `Tool ${toolName} failed`);
    }

    if (Object.prototype.hasOwnProperty.call(body, "result")) {
      return body.result;
    }

    return body;
  }

  headers(extra = {}) {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...extra,
    };
  }

  async request(path, init) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.url(path), {
        ...init,
        signal: controller.signal,
      });
      const text = await response.text();
      const body = parseResponseBody(text);

      if (!response.ok) {
        throw new Error(`Caidazi API request failed with HTTP ${response.status}: ${stringifyBody(body)}`);
      }

      return body;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(redactSecret(message, this.apiKey));
    } finally {
      clearTimeout(timer);
    }
  }

  url(path) {
    return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }
}

export function redactSecret(text, apiKey) {
  let redacted = String(text);

  if (apiKey) {
    redacted = redacted.split(apiKey).join("[REDACTED]");
  }

  return redacted.replace(/cdz_live_[A-Za-z0-9_-]+/g, "[REDACTED]");
}

function parseResponseBody(text) {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function stringifyBody(body) {
  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}
