// Run 13 (R13-20c): the /mcp body-size check must count UTF-8 bytes, not JavaScript string length (characters), so a
// body full of multi-byte characters cannot sneak a request past the limit, and a body that is genuinely a little
// under the byte limit is not wrongly refused. In-process through the Netlify function handler (no network, no deploy).
// Run: npm run build, then node --test tests/mcp-utf8-body.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));

const MAX_BODY = 262144;
const ACCEPT = "application/json, text/event-stream";
const post = (body) => handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: ACCEPT }, body }));

// "中" is one character (one UTF-16 code unit, so it counts as 1 toward a naive .length check) but 3 bytes in UTF-8.
// It rides in the JSON-RPC "id" field (any JSON value is a valid id) so the padded body stays a plain, valid tools/list
// request once past the size check; a made-up extra top-level field would fail request validation instead.
const CH = "中";
const wrap = (idValue) => JSON.stringify({ jsonrpc: "2.0", id: idValue, method: "tools/list" });
const headBytes = Buffer.byteLength(wrap(""));

test("multi-byte UTF-8 body: under the byte limit runs, over the byte limit gets 413, both counted in bytes not characters", async () => {
  // Just under the byte limit: mostly 3-byte characters, topped up with single-byte spaces to land exactly one byte short.
  const n = Math.floor((MAX_BODY - 1 - headBytes) / 3);
  const short = MAX_BODY - 1 - Buffer.byteLength(wrap(CH.repeat(n)));
  const under = wrap(CH.repeat(n) + " ".repeat(short));
  assert.equal(Buffer.byteLength(under), MAX_BODY - 1);
  assert.ok(under.length < MAX_BODY, "character count is well under the byte limit thanks to the multi-byte characters");
  const okRes = await post(under);
  assert.equal(okRes.status, 200);

  // Over the byte limit, while the character count (JS string .length) still stays under the limit.
  const n2 = Math.ceil((MAX_BODY + 1 - headBytes) / 3);
  const over = wrap(CH.repeat(n2));
  assert.ok(Buffer.byteLength(over) > MAX_BODY, "over the byte limit");
  assert.ok(over.length < MAX_BODY, "under the limit if it were wrongly counted in characters");
  const r = await post(over);
  const j = await r.json();
  assert.equal(r.status, 413);
  assert.equal(j.error.code, -32600);
});
