// REST endpoint for the web app: POST /api/tools/<tool name>.
// It runs the tool through the SAME createServer() that the MCP endpoint (mcp.mjs) and the npm package use,
// by connecting an in-memory MCP client to it and calling tools/call. No tool logic is copied here, so a web
// form and an AI assistant get the same answer for the same input.
// Protection: rate limit (config below), a body size cap, input validation against the tool's own input schema,
// and a honeypot field. Nothing is stored and nothing about the input is logged.

import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createServer } from "../../src/index.ts";

const MAX_BODY_BYTES = 32000;
const MAX_TEXT = 6000;
const MAX_ITEMS = 50;
const HONEYPOT = "leave_this_empty";

async function connectClient() {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverSide);
  const client = new Client({ name: "web-app", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

// Turn one raw value into the type its schema asks for. Form posts send text; JSON posts can send real types.
function coerce(prop, raw, key, errors) {
  const type = prop.type;
  if (type === "string") {
    if (typeof raw !== "string") { errors.push(`${key} must be text.`); return undefined; }
    const v = raw.trim();
    if (v.length > MAX_TEXT) { errors.push(`${key} is longer than ${MAX_TEXT} characters.`); return undefined; }
    if (prop.enum && v !== "" && !prop.enum.includes(v)) { errors.push(`${key} must be one of: ${prop.enum.join(", ")}.`); return undefined; }
    return v === "" ? undefined : v;
  }
  if (type === "number" || type === "integer") {
    if (typeof raw === "string" && raw.trim() === "") return undefined;
    const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, "").trim());
    if (!Number.isFinite(n)) { errors.push(`${key} must be a number.`); return undefined; }
    return n;
  }
  if (type === "boolean") {
    if (typeof raw === "boolean") return raw;
    const v = String(raw).trim().toLowerCase();
    if (v === "") return undefined;
    if (["true", "on", "yes", "1"].includes(v)) return true;
    if (["false", "off", "no", "0"].includes(v)) return false;
    errors.push(`${key} must be yes or no.`);
    return undefined;
  }
  if (type === "array") {
    let list = raw;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t === "") return undefined;
      if (t.startsWith("[")) {
        try { list = JSON.parse(t); } catch { errors.push(`${key} is not valid JSON.`); return undefined; }
      } else if (prop.items && prop.items.type === "string") {
        list = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      } else {
        errors.push(`${key} must be a JSON list.`); return undefined;
      }
    }
    if (!Array.isArray(list)) { errors.push(`${key} must be a list.`); return undefined; }
    if (list.length > MAX_ITEMS) { errors.push(`${key} has more than ${MAX_ITEMS} items.`); return undefined; }
    const itemType = prop.items && prop.items.type;
    for (const item of list) {
      if (itemType === "string" && (typeof item !== "string" || item.length > MAX_TEXT)) { errors.push(`${key} must be a list of short texts.`); return undefined; }
      if (itemType === "object" && (item === null || typeof item !== "object" || Array.isArray(item))) { errors.push(`${key} must be a list of objects.`); return undefined; }
    }
    return list;
  }
  if (type === "object") {
    let obj = raw;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t === "") return undefined;
      try { obj = JSON.parse(t); } catch { errors.push(`${key} is not valid JSON.`); return undefined; }
    }
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) { errors.push(`${key} must be an object.`); return undefined; }
    return obj;
  }
  return raw;
}

function validate(tool, input) {
  const props = (tool.inputSchema && tool.inputSchema.properties) || {};
  const required = (tool.inputSchema && tool.inputSchema.required) || [];
  const errors = [];
  const args = {};
  for (const key of Object.keys(input)) {
    if (!(key in props)) errors.push(`Unknown field: ${key}.`);
  }
  for (const [key, prop] of Object.entries(props)) {
    if (input[key] === undefined || input[key] === null) continue;
    const v = coerce(prop, input[key], key, errors);
    if (v !== undefined) args[key] = v;
  }
  for (const key of required) {
    if (args[key] === undefined) errors.push(`${key} is required.`);
  }
  if (JSON.stringify(args).length > MAX_BODY_BYTES) errors.push("The input is too long.");
  return { args, errors };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function htmlPage(title, bodyHtml, status) {
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/brand.css"><link rel="stylesheet" href="/assets/app.css"></head>` +
    `<body><main class="hx-body hx-result-page">${bodyHtml}</main></body></html>`;
  return new Response(page, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export default async (req, context) => {
  const toolName = context.params && context.params.tool;
  const wantsHtml = (req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded");
  const reply = (status, payload) => {
    if (wantsHtml) {
      const back = `<p><a href="/tools/${esc(String(toolName || "").replace(/_/g, "-"))}/">Back to the tool</a></p>`;
      const body = payload.ok
        ? `<h1>${esc(payload.title)}</h1><p class="hx-mono">Result</p><pre class="hx-result-text">${esc(payload.text)}</pre>${back}`
        : `<h1>Could not run the tool</h1><ul>${(payload.errors || [payload.error]).map((e) => `<li>${esc(e)}</li>`).join("")}</ul>${back}`;
      return htmlPage(payload.ok ? payload.title : "Could not run the tool", body, status);
    }
    return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST with a JSON body: {\"input\": {...}}. See /docs/." }),
      { status: 405, headers: { "Content-Type": "application/json", Allow: "POST" } });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return reply(413, { ok: false, error: "The request is too large." });

  let input = {};
  let honeypot = "";
  try {
    if (wantsHtml) {
      const form = new URLSearchParams(raw);
      for (const [k, v] of form.entries()) {
        if (k === HONEYPOT) { honeypot = v; continue; }
        input[k] = v;
      }
    } else {
      const body = JSON.parse(raw || "{}");
      honeypot = body[HONEYPOT] || "";
      input = body.input && typeof body.input === "object" && !Array.isArray(body.input) ? body.input : null;
      if (!input) return reply(400, { ok: false, error: "Send a JSON body with an \"input\" object." });
    }
  } catch {
    return reply(400, { ok: false, error: "The request body could not be read." });
  }
  if (honeypot) return reply(400, { ok: false, error: "The request could not be processed." });

  let client;
  try {
    client = await connectClient();
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) return reply(404, { ok: false, error: `Unknown tool: ${toolName}.` });
    const { args, errors } = validate(tool, input);
    if (errors.length) return reply(400, { ok: false, errors });
    const result = await client.callTool({ name: tool.name, arguments: args });
    const text = (result.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n\n");
    return reply(result.isError ? 422 : 200, { ok: !result.isError, tool: tool.name, title: tool.title || tool.name, text, error: result.isError ? text : undefined });
  } catch {
    return reply(500, { ok: false, error: "The tool could not run. Please try again." });
  } finally {
    if (client) await client.close().catch(() => {});
  }
};

export const config = {
  path: "/api/tools/:tool",
  rateLimit: {
    windowSize: 60,
    windowLimit: 30,
    aggregateBy: ["ip", "domain"],
  },
};
