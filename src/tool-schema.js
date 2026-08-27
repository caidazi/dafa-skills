export function createMcpTool(toolInfo) {
  return {
    name: toolInfo.name,
    description: describeTool(toolInfo),
    inputSchema: parseInputDetailToSchema(toolInfo.input_detail),
  };
}

function describeTool(toolInfo) {
  const description = toolInfo.description || toolInfo.name;
  const boundary = ACCOUNT_TOOL_BOUNDARIES[toolInfo.name];
  if (!boundary) {
    return description;
  }

  if (hasCaidaziAccountBoundary(description)) {
    return description;
  }

  return `${description} 边界：${boundary}`;
}

function hasCaidaziAccountBoundary(description) {
  return (
    description.includes("当前 API Key 绑定的财搭子 App") ||
    description.includes("不代表券商账户") ||
    description.includes("不用于其他平台")
  );
}

const ACCOUNT_TOOL_BOUNDARIES = Object.freeze({
  get_caidazi_user_watchlist:
    "仅读取当前 API Key 绑定的财搭子 App 自选池，不代表券商账户或其他平台自选。",
  get_caidazi_positions_summary:
    "仅读取当前 API Key 绑定的财搭子 App 中已授权的持仓摘要，不代表完整券商账户。",
  get_caidazi_portfolio_snapshot:
    "仅读取当前 API Key 绑定的财搭子 App 自选、持仓和组合快照。",
  add_caidazi_watchlist:
    "仅向当前 API Key 绑定的财搭子 App 自选池添加标的，不用于其他平台自选、持仓或交易。",
  remove_caidazi_watchlist:
    "仅从当前 API Key 绑定的财搭子 App 自选池移除标的，不用于其他平台自选、持仓或交易。",
  get_caidazi_monitor_tasks:
    "仅只读查询当前 API Key 绑定的财搭子 App 已有监控任务，不创建、订阅或删除监控任务。",
});

export function parseInputDetailToSchema(inputDetail) {
  const properties = {};
  const required = [];

  for (const row of parseMarkdownRows(inputDetail)) {
    const [rawName, rawType, rawRequired, rawDescription] = row;
    const name = cleanCell(rawName).replace(/^`|`$/g, "");

    if (!name || name === "参数" || isNoParameterName(name) || /^-+$/.test(name)) {
      continue;
    }

    properties[name] = {
      ...typeToSchema(cleanCell(rawType)),
      description: cleanCell(rawDescription),
    };

    if (isRequired(cleanCell(rawRequired))) {
      required.push(name);
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: true,
  };
}

export function resultToContent(result, notice = null) {
  const payload = notice ? withNotice(result, notice) : result;
  const noticeText = noticeToText(notice);
  const content = [];

  if (typeof payload === "string") {
    content.push({ type: "text", text: payload });
  } else {
    content.push({
      type: "text",
      text: JSON.stringify(payload, null, 2),
    });
  }

  if (noticeText) {
    content.push({ type: "text", text: noticeText });
  }

  return content;
}

function withNotice(result, notice) {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return {
      ...result,
      _notice: {
        ...(result._notice || {}),
        ...notice,
      },
    };
  }

  return {
    data: result,
    _notice: notice,
  };
}

function noticeToText(notice) {
  const update = notice?.update;
  if (!update) {
    return "";
  }

  const message = update.message || "财搭子 MCP/Skills 有新版本可用。";
  const command = update.command ? `更新命令：${update.command}` : "";
  return [
    "财搭子 MCP/Skills 更新提醒",
    message,
    command,
    "当前任务完成后建议更新；更新后刷新 MCP 工具列表或新建 session。",
  ].filter(Boolean).join("\n");
}

function parseMarkdownRows(inputDetail = "") {
  return String(inputDetail)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells.length >= 4 && !cells.every((cell) => /^-+$/.test(cell)));
}

function cleanCell(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRequired(value) {
  return /^(是|必填|required|true|yes)$/i.test(value);
}

function isNoParameterName(value) {
  return /^(无参数|无|none|no parameters?|n\/a)$/i.test(value);
}

function typeToSchema(type) {
  const normalized = type.toLowerCase().replace(/\s+/g, "");

  if (/^(.+)\[\]$/.test(normalized)) {
    const itemType = normalized.match(/^(.+)\[\]$/)[1];
    return {
      type: "array",
      items: typeToSchema(itemType),
    };
  }

  if (/^array\[(.+)\]$/.test(normalized)) {
    const itemType = normalized.match(/^array\[(.+)\]$/)[1];
    return {
      type: "array",
      items: typeToSchema(itemType),
    };
  }

  if (["array", "list"].includes(normalized)) {
    return { type: "array" };
  }

  if (["int", "integer"].includes(normalized)) {
    return { type: "integer" };
  }

  if (["number", "float", "double"].includes(normalized)) {
    return { type: "number" };
  }

  if (["bool", "boolean"].includes(normalized)) {
    return { type: "boolean" };
  }

  if (["object", "dict", "map"].includes(normalized)) {
    return { type: "object" };
  }

  return { type: "string" };
}
