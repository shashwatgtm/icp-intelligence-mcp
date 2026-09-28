// Hosted MCP endpoint: Streamable HTTP, stateless, JSON responses.
// Follows Netlify's guide "How to build and deploy an MCP server on Netlify" (2026-09-12):
// one function, a fresh server and transport per request, POST only, rate limited.
// The tools come from the same createServer() that the npm (stdio) package uses.

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../../src/index.ts";

// Run 11 addendum 2 (R11-A2-3): the same limits as GTM Alpha's /mcp (gtm-alpha-secure netlify/functions/mcp-sse.js).
// The whole request may be at most 64 KB (65,536 bytes), one JSON-RPC message per request (no batches), and each text
// input at most 4,000 characters. The checks sit here, before the SDK, so the tool definitions in tools/list are
// unchanged; a request inside the limits runs exactly as before. Any error thrown here answers -32603 with a plain
// message (no stack, no file path).
const MAX_BODY = 65536;
const MAX_TEXT = 4000;
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

// Every text input longer than MAX_TEXT, at any depth (a list of competitors is checked item by item).
function tooLong(value, name, out) {
  if (typeof value === "string") {
    if (value.length > MAX_TEXT) out.push(name + " is longer than " + MAX_TEXT + " characters");
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => tooLong(v, name + "[" + i + "]", out));
  } else if (value && typeof value === "object") {
    for (const key of Object.keys(value)) tooLong(value[key], name ? name + "." + key : key, out);
  }
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
      return rpcError(null, -32600, "Invalid request: the request body is larger than 64 KB.", 413);
    }
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.byteLength > MAX_BODY) {
      return rpcError(null, -32600, "Invalid request: the request body is larger than 64 KB.", 413);
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
      const long = tooLong(params.arguments, "", []);
      if (long.length > 0) {
        return toolError(body.id, "Invalid input for " + String(params.name).slice(0, 100) + ": " + long.join("; ") + ".");
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
