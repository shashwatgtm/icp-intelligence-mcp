// Hosted MCP endpoint: Streamable HTTP, stateless, JSON responses.
// Follows Netlify's guide "How to build and deploy an MCP server on Netlify" (2026-09-12):
// one function, a fresh server and transport per request, POST only, rate limited.
// The tools come from the same createServer() that the npm (stdio) package uses.

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../../src/index.ts";

// Run 11 addendum 2 (R11-A2-3), addendum 3 (R11-A3-9) and addendum 4 (R11-A4-1): limits and input checks before the SDK,
// so the tool definitions in tools/list are unchanged and a request inside the limits runs exactly as before.
// - The whole request may be at most 256 KB (262,144 bytes), counted in bytes, and holds one JSON-RPC message (no batches).
// - A text input may be at most 4,000 characters, at any depth. The long-text fields below (a pasted document, article,
//   transcript, notes or content) may be at most 100,000 characters.
// - A tools/call argument whose JSON type does not match the tool's input schema is refused as a tool error.
// - A tool name that is not text, or is longer than 100 characters, answers "Unknown tool" and is never echoed.
// Any error thrown here answers -32603 with a plain message (no stack, no file path).
const MAX_BODY = 262144;
const MAX_TEXT = 4000;
const MAX_LONG_TEXT = 100000;
const MAX_NAME = 100;
// Tool name to the fields that take a pasted document, article, transcript, notes or content.
const LONG_TEXT = {
  "icp_interview_synthesizer": [
    "raw_transcripts"
  ]
};
// Answers are never cached (privacy page: web and MCP answers are sent with Cache-Control: no-store).
const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000",
};

function rpcError(id, code, message, status, extraHeaders) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: id === undefined ? null : id }), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS, ...(extraHeaders || {}) },
  });
}

function toolError(id, text) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError: true } }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

// The input schema of every tool, read once from the server's own tools/list (the same answer clients get).
let schemasPromise = null;
function toolSchemas() {
  if (!schemasPromise) {
    schemasPromise = (async () => {
      const server = createServer();
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      await server.connect(transport);
      const list = { jsonrpc: "2.0", id: 1, method: "tools/list" };
      const res = await transport.handleRequest(
        new Request("http://localhost/mcp", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
          body: JSON.stringify(list),
        }),
        { parsedBody: list }
      );
      const tools = (await res.json()).result.tools;
      return new Map(tools.map((t) => [t.name, t.inputSchema || {}]));
    })().catch((error) => {
      schemasPromise = null;
      throw error;
    });
  }
  return schemasPromise;
}

const TYPE_WORDS = {
  string: "text",
  number: "a number",
  integer: "a whole number",
  boolean: "true or false",
  array: "a list",
  object: "an object",
};

// Every argument whose JSON type does not match the schema. Nested values are checked only where the schema describes
// them (object properties, list items). A null or missing object member counts as not given (the tool's own required
// check handles it); a null list item is refused. A number field also accepts text: the tool reads a number sent as
// text the way the web form does, or refuses it with its own message (run 6 decision N2).
function wrongType(schema, value, name, out, isItem) {
  if (value === undefined || (value === null && !isItem) || !schema || typeof schema !== "object") return out;
  const type = schema.type;
  let ok = true;
  if (type === "string") ok = typeof value === "string";
  else if (type === "number") ok = typeof value === "number" || typeof value === "string";
  else if (type === "integer") ok = Number.isInteger(value) || typeof value === "string";
  else if (type === "boolean") ok = typeof value === "boolean";
  else if (type === "array") ok = Array.isArray(value);
  else if (type === "object") ok = value !== null && typeof value === "object" && !Array.isArray(value);
  if (!ok) {
    out.push(name + " must be " + TYPE_WORDS[type] + ".");
    return out;
  }
  if (type === "array" && schema.items && typeof schema.items === "object") {
    value.forEach((v, i) => wrongType(schema.items, v, name + "[" + i + "]", out, true));
  } else if (type === "object" && schema.properties) {
    for (const [key, sub] of Object.entries(schema.properties)) wrongType(sub, value[key], name ? name + "." + key : key, out, false);
  }
  return out;
}

const count = (n) => n.toLocaleString("en-US");

// Every text input over its limit, at any depth (a list of competitors is checked item by item).
function tooLong(value, name, out, limit) {
  if (typeof value === "string") {
    if (value.length > limit) {
      out.push(
        name + " is longer than " + count(limit) + " characters. " + (limit > MAX_TEXT ? "Shorten it or split it into parts." : "Shorten it.")
      );
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => tooLong(v, name + "[" + i + "]", out, MAX_TEXT));
  } else if (value && typeof value === "object") {
    for (const key of Object.keys(value)) tooLong(value[key], name ? name + "." + key : key, out, MAX_TEXT);
  }
  return out;
}

function argumentsTooLong(tool, args) {
  const out = [];
  if (!args || typeof args !== "object" || Array.isArray(args)) return tooLong(args, "arguments", out, MAX_TEXT);
  const long = LONG_TEXT[tool] || [];
  for (const key of Object.keys(args)) tooLong(args[key], key, out, long.includes(key) ? MAX_LONG_TEXT : MAX_TEXT);
  return out;
}

export default async (req) => {
  let id = null;
  if (req.method !== "POST") {
    return rpcError(
      null,
      -32000,
      "Method not allowed. This MCP endpoint accepts POST requests only (Streamable HTTP, stateless). Setup instructions: https://icp-intelligence.gtmhelix.com/",
      405,
      { Allow: "POST" }
    );
  }
  try {
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_BODY) {
      return rpcError(null, -32600, "Invalid request: the request body is larger than 256 KB (262,144 bytes).", 413);
    }
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.byteLength > MAX_BODY) {
      return rpcError(null, -32600, "Invalid request: the request body is larger than 256 KB (262,144 bytes).", 413);
    }
    let body;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return rpcError(null, -32700, "Parse error: the request body is not valid JSON.", 400);
    }
    if (Array.isArray(body)) {
      return rpcError(null, -32600, "Batch requests are not supported. Send one JSON-RPC message per request.", 400);
    }
    if (body && body.id !== undefined) id = body.id;
    if (body && body.method === "tools/call" && body.id !== undefined) {
      const params = body.params && typeof body.params === "object" ? body.params : {};
      const schemas = await toolSchemas();
      const name = params.name;
      if (typeof name !== "string" || name.length > MAX_NAME) {
        return toolError(body.id, "Unknown tool. Available tools: " + [...schemas.keys()].join(", ") + ".");
      }
      const args = params.arguments;
      if (schemas.has(name) && args !== undefined && args !== null) {
        const wrong = wrongType(schemas.get(name), args, "", [], false).map((p) => (p.startsWith(" must") ? "arguments" + p : p));
        if (wrong.length > 0) {
          return toolError(body.id, "Invalid input for " + name + ": " + wrong.join(" "));
        }
      }
      const long = argumentsTooLong(name, args);
      if (long.length > 0) {
        return toolError(body.id, "Invalid input for " + name + ": " + long.join(" "));
      }
    }
    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const res = await transport.handleRequest(req, { parsedBody: body });
    const headers = new Headers(res.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  } catch (error) {
    console.error("mcp error:", error && error.message);
    return rpcError(id, -32603, "Internal error while handling the request. Please try again.", 500);
  }
};

export const config = {
  path: "/mcp",
  rateLimit: {
    windowSize: 60,
    windowLimit: 300,
    aggregateBy: ["ip", "domain"],
  },
};
