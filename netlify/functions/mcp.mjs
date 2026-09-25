// Hosted MCP endpoint: Streamable HTTP, stateless, JSON responses.
// Follows Netlify's guide "How to build and deploy an MCP server on Netlify" (2026-09-12):
// one function, a fresh server and transport per request, POST only, rate limited.
// The tools come from the same createServer() that the npm (stdio) package uses.

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../../src/index.ts";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed. This MCP endpoint accepts POST requests only (Streamable HTTP, stateless). Setup instructions: https://icp-intelligence.gtmhelix.com/",
        },
        id: null,
      }),
      { status: 405, headers: { "Content-Type": "application/json", Allow: "POST" } }
    );
  }
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  // Answers are never cached (privacy page: web and MCP answers are sent with Cache-Control: no-store).
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

export const config = {
  path: "/mcp",
  rateLimit: {
    windowSize: 60,
    windowLimit: 300,
    aggregateBy: ["ip", "domain"],
  },
};
