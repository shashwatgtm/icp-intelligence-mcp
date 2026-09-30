// Run 17 D56 (the owner's decision, 1 October 2026: fix each SAFE item of the run 16 backlog, test first).
// Backlog items 8 and 15 (verifier note 2): tam_sam_som_calculator printed a market share below 0.05% as "0.0%", so the
// formula line read "SOM = $30 × 0.0%" for a result of $0.01. The share now prints as given when it is under 0.05%;
// every share of 0.05% or more prints exactly as before (one decimal).
// Backlog item 19 (verifier note 6): account_prioritization with the fit weight at 0 still said "Why prioritized: Strong ICP
// fit". A signal whose weight is 0 is no longer given as the reason. Scores, tiers and weights are unchanged.
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

test("a share of 0.03% prints as 0.03%, not 0.0%", async () => {
  const t = await call("tam_sam_som_calculator", { total_potential_companies: 10, average_contract_value: 10, icp_percentage: 30, year1_market_share_target: 0.03 });
  assert.match(t, /\| Year 1 Market Share Target \| 0\.03% \| Your input \|/);
  assert.match(t, /SOM = \$30 × 0\.03%/);
  assert.doesNotMatch(t, /× 0\.0%/);
});

test("a share of 3% prints exactly as before", async () => {
  const t = await call("tam_sam_som_calculator", { total_potential_companies: 12000, average_contract_value: 8000, icp_percentage: 30, year1_market_share_target: 3 });
  assert.match(t, /\| Year 1 Market Share Target \| 3\.0% \| Your input \|/);
  assert.match(t, /\| Year 2 \| 6\.0% /);
});

const ACCOUNTS = [
  { name: "Acme", fit_score: 90, intent_signals: 40, relationship: 30, timing: "soon" },
  { name: "Beta", fit_score: 50, intent_signals: 85, relationship: 20, timing: "now" },
];

test("fit weight 0: the reason is not 'Strong ICP fit'", async () => {
  const t = await call("account_prioritization", { accounts: ACCOUNTS, prioritization_weights: { fit: 0, intent: 40, relationship: 30, timing: 30 } });
  assert.doesNotMatch(t, /Why prioritized\*\*: Strong ICP fit/);
});

test("default weights: the reasons are unchanged", async () => {
  const t = await call("account_prioritization", { accounts: ACCOUNTS });
  assert.match(t, /### \d\. Acme \(Tier [A-D]\)\n- \*\*Why prioritized\*\*: Strong ICP fit/);
  assert.match(t, /### \d\. Beta \(Tier [A-D]\)\n- \*\*Why prioritized\*\*: High buying intent/);
});
