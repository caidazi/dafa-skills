export function createMcpTool(toolInfo) {
  return {
    name: toolInfo.name,
    description: toolInfo.description || toolInfo.name,
    inputSchema: parseInputDetailToSchema(toolInfo.input_detail),
  };
}

export function parseInputDetailToSchema(inputDetail) {
  const properties = {};
  const required = [];

  for (const row of parseMarkdownRows(inputDetail)) {
    const [rawName, rawType, rawRequired, rawDescription] = row;
    const name = cleanCell(rawName).replace(/^`|`$/g, "");

    if (!name || name === "参数" || /^-+$/.test(name)) {
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

export function resultToContent(result) {
  if (typeof result === "string") {
    return [{ type: "text", text: result }];
  }

  return [
    {
      type: "text",
      text: JSON.stringify(result, null, 2),
    },
  ];
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

function typeToSchema(type) {
  const normalized = type.toLowerCase().replace(/\s+/g, "");

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
