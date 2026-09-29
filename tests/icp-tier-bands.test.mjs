// D30: icp_scoring_model's Qualification Tiers table must be bands of the maximum score
// (sum of the criteria weights), not fixed points. With the default weights (M = 100) the
// bands must equal the old fixed ranges exactly. Tested in-process through the Netlify
// function handler netlify/functions/mcp.mjs (no network, no deploy).
// Run: npm run build, then node --test tests/icp-tier-bands.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const ACCEPT = "application/json, text/event-stream";

const post = (body) =>
  handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: ACCEPT }, body }));
let nextId = 1;
const call = async (args) => {
  const r = await post(JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "icp_scoring_model", arguments: args } }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

test("icp_scoring_model: default weights (M = 100) print today's exact fixed bands", async () => {
  const out = await call({});
  assert.match(out, /\*\*Maximum Score\*\*: 100 points/);
  assert.match(out, /\| \*\*A: Hot\*\* \| 80-100 \| Immediate outreach, fast-track \| Demo within 24 hours \|/);
  assert.match(out, /\| \*\*B: Warm\*\* \| 60-79 \| Priority follow-up \| Demo within 48 hours \|/);
  assert.match(out, /\| \*\*C: Developing\*\* \| 40-59 \| Nurture sequence \| Weekly touch \|/);
  assert.match(out, /\| \*\*D: Unqualified\*\* \| 0-39 \| Marketing nurture only \| Auto-nurture \|/);
  assert.match(out, /The bands are 80%, 60% and 40% of your maximum score of 100 points\./);
});

test("icp_scoring_model: M = 40 (one critical + one important criterion) gives A 32-40, B 24-31, C 16-23, D 0-15", async () => {
  const out = await call({
    scoring_criteria: [
      { criterion: "Budget Authority", importance: "critical", values: ["Confirmed", "Planned", "Exploring", "None"] },
      { criterion: "Buying Timeline", importance: "important", values: ["Active", "This quarter", "This year", "Exploring"] }
    ]
  });
  assert.match(out, /\*\*Maximum Score\*\*: 40 points/);
  assert.match(out, /\| \*\*A: Hot\*\* \| 32-40 \| Immediate outreach, fast-track \| Demo within 24 hours \|/);
  assert.match(out, /\| \*\*B: Warm\*\* \| 24-31 \| Priority follow-up \| Demo within 48 hours \|/);
  assert.match(out, /\| \*\*C: Developing\*\* \| 16-23 \| Nurture sequence \| Weekly touch \|/);
  assert.match(out, /\| \*\*D: Unqualified\*\* \| 0-15 \| Marketing nurture only \| Auto-nurture \|/);
  assert.match(out, /The bands are 80%, 60% and 40% of your maximum score of 40 points\./);
});
