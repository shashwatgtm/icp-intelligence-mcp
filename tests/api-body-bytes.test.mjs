// Run 14 (R14-10f): the web form endpoint netlify/functions/api.mjs (built from work/hosted/api.mjs.template)
// has its OWN body size cap, MAX_BODY_BYTES = 32,000, separate from /mcp's mcp.mjs (262,144, covered by
// mcp-utf8-body.test.mjs). api.mjs measures the raw request text in UTF-8 bytes, before any JSON parsing:
// `if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply(413, ...)`. This test proves that
// check is byte-based, not character-based, the same way mcp-utf8-body.test.mjs proves it for mcp.mjs.
// In-process through the Netlify function handler (no network, no deploy).
// Run: npm run build, then node --test tests/api-body-bytes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/api.mjs", import.meta.url));

const MAX_BODY_BYTES = 32000;
const post = (body) =>
  handler(new Request("https://x.gtmhelix.com/api/tools/x", { method: "POST", body }), { params: { tool: "x" } });

// "中" is one character (one UTF-16 code unit, so it counts as 1 toward a naive .length check) but 3 bytes in UTF-8.
const CH = "中";

test("api.mjs body size: a body under 32,000 characters but over 32,000 UTF-8 bytes answers 413, counted in bytes not characters", async () => {
  const n = Math.ceil((MAX_BODY_BYTES + 1) / 3);
  const over = CH.repeat(n);
  assert.ok(Buffer.byteLength(over) > MAX_BODY_BYTES, "over the byte limit");
  assert.ok(over.length < MAX_BODY_BYTES, "under the limit if it were wrongly counted in characters");
  const r = await post(over);
  const j = await r.json();
  assert.equal(r.status, 413);
  assert.equal(j.ok, false);
  assert.equal(j.error, "The request is too large.");
});

test("api.mjs body size: a body just under the byte limit does not answer 413", async () => {
  const n = Math.floor((MAX_BODY_BYTES - 1) / 3);
  const short = MAX_BODY_BYTES - 1 - Buffer.byteLength(CH.repeat(n));
  const under = CH.repeat(n) + " ".repeat(short);
  assert.equal(Buffer.byteLength(under), MAX_BODY_BYTES - 1);
  assert.ok(under.length < MAX_BODY_BYTES, "character count is well under the byte limit thanks to the multi-byte characters");
  const r = await post(under);
  assert.notEqual(r.status, 413);
});
