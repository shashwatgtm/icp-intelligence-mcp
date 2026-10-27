// 27 Oct 2026: a call that carries an mcp-protocol-version header this SDK does not know is answered, not refused with
// 400 "Unsupported protocol version"; a known version and no header work as before. In-process, no network, no deploy.
// Run: npm run build, then node --test tests/mcp-protocol-version.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const ACCEPT = "application/json, text/event-stream";
const post = (msg, extra = {}) =>
  handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: ACCEPT, ...extra }, body: JSON.stringify(msg) }));
const list = { jsonrpc: "2.0", id: 1, method: "tools/list" };

for (const [label, extra] of [["no header", {}], ["2025-11-25", { "mcp-protocol-version": "2025-11-25" }], ["2025-06-18", { "mcp-protocol-version": "2025-06-18" }], ["an unknown newer version", { "mcp-protocol-version": "2026-07-01" }], ["an unknown text", { "mcp-protocol-version": "draft" }]]) {
  test("tools/list with " + label + " answers 200 with the tools", async () => {
    const r = await post(list, extra);
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.ok(Array.isArray(j.result.tools) && j.result.tools.length > 0, JSON.stringify(j).slice(0, 300));
    assert.equal(r.headers.get("cache-control"), "no-store");
  });
}

test("a tools/call with an unknown version runs the tool", async () => {
  const j0 = await (await post(list)).json();
  const tool = j0.result.tools[0];
  const args = {};
  for (const k of tool.inputSchema.required || []) {
    const p = tool.inputSchema.properties[k] || {};
    args[k] = Array.isArray(p.enum) && p.enum.length ? p.enum[0] : p.type === "number" || p.type === "integer" ? 100 : p.type === "boolean" ? true : p.type === "array" ? ["B2B SaaS"] : p.type === "object" ? {} : "B2B SaaS";
  }
  const r = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: tool.name, arguments: args } }, { "mcp-protocol-version": "2026-07-01" });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(j.result && Array.isArray(j.result.content), JSON.stringify(j).slice(0, 300));
});

test("a notification with an unknown version is accepted (202)", async () => {
  const r = await post({ jsonrpc: "2.0", method: "notifications/initialized" }, { "mcp-protocol-version": "2026-07-01" });
  assert.equal(r.status, 202);
});

test("the input checks still run first: bad JSON is still 400 -32700", async () => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: ACCEPT, "mcp-protocol-version": "2026-07-01" }, body: "{" }));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error.code, -32700);
});
