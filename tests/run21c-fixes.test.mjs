// Run 21c job 4 (round 1 judge reasons, test first). Plain words, no names. Run: node --no-warnings --test tests/run21c-fixes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

test("the first industry after 'in' in the ideal profile is a segment (banks are not 'outside the ideal profile' when the ideal names them first)", async () => {
  const t = await call("icp_gap_analysis", {
    company: "Plain Works", product_category: "business services for customer operations",
    current_customers: "Customers: banking and financial services, communications, energy and utilities",
    ideal_icp: "operations leaders at large enterprises in banking and financial services, communications, media and retail, with the Chief Customer Officer as the buyer",
    current_metrics: { avg_acv: 400000, churn_rate: 6 },
  });
  const dq = t.slice(t.indexOf("Disqualification Criteria"));
  assert.doesNotMatch(dq.split("\n").slice(0, 4).join("\n"), /Segments outside the ideal profile\*\*: banking and financial services/i);
  assert.match(t, /Segments\*\*: banking and financial services/i);
});
