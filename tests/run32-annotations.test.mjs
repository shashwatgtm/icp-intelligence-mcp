// Run 32D R32D-02 (Claude directory, connector submission): every tool in tools/list has a title and the honest annotations.
// Every tool of this server only computes an answer from its inputs: it stores nothing, changes nothing and reaches nothing outside
// the server, so readOnlyHint is true, destructiveHint false and openWorldHint false. Already true on the candidate head (the
// titles and annotations came with the hosted connector); this test keeps it so.
// The hosted handler is found from the repo layout (netlify/functions/mcp.mjs, or mcp-sse.js on GTM Alpha).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const file = ["../netlify/functions/mcp.mjs", "../netlify/functions/mcp-sse.js"].map((p) => new URL(p, import.meta.url)).find((u) => existsSync(u));
const { default: handler } = await import(file);
const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
  method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
}), {});
const tools = (await r.json()).result.tools;

test("tools/list has tools", () => assert.ok(tools.length > 0));

test("every tool has a title and a readOnlyHint or destructiveHint annotation", () => {
  for (const t of tools) {
    assert.ok(typeof t.title === "string" && t.title.trim() !== "", `${t.name}: no title`);
    assert.ok(t.annotations && typeof t.annotations === "object", `${t.name}: no annotations`);
    assert.ok(typeof t.annotations.readOnlyHint === "boolean" || typeof t.annotations.destructiveHint === "boolean", `${t.name}: no hint`);
  }
});

test("the hints are the honest ones for tools that only compute: read only, not destructive, closed world", () => {
  for (const t of tools) {
    assert.equal(t.annotations.readOnlyHint, true, `${t.name}: readOnlyHint`);
    assert.equal(t.annotations.destructiveHint, false, `${t.name}: destructiveHint`);
    assert.equal(t.annotations.openWorldHint, false, `${t.name}: openWorldHint`);
    assert.equal(t.annotations.title, t.title, `${t.name}: annotation title differs from title`);
  }
});
