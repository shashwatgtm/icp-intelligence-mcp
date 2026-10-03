// Run 21c round 4 (test first): icp_gap_analysis turned "businesses of all sizes, from startups to large enterprises ... with Vice President of Operations as the buyer"
// into a segment "from" and a second role "Vice President of Operations as the". Words like "from" are not segments, and a role does not keep the words after it.
// Run: node --no-warnings --test tests/run21c-gap-parse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};

test("an ideal profile with a size range and a buyer clause gives no stray segment or half role", async () => {
  const out = await call("icp_gap_analysis", {
    company: "Plain Co", product_category: "route planning software for delivery fleets",
    current_customers: "Plain Co customers: Retail, Food distribution, Parcel carriers",
    ideal_icp: "dispatch teams and fleet leaders at businesses of all sizes, from startups to large enterprises, with Vice President of Operations as the buyer, who face late deliveries and manual planning",
  });
  const table = out.split("\n").filter((l) => /^\| \*\*/.test(l)).join("\n");   // the quoted input above the table keeps the user's own words
  assert.doesNotMatch(table, /\| from \||ideal profile: from\b/);
  assert.doesNotMatch(table, /Vice President of Operations as the/);
  assert.match(table, /Vice President of Operations/);
});
