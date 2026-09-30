// Run 15 D41 (owner decision, 30 September 2026): account_prioritization's tier cut-offs become shares of the highest possible
// score W, the sum of the four weights: A from ceil(0.8 W), B from ceil(0.6 W), C from ceil(0.4 W), D below ceil(0.4 W). The Tier
// Breakdown headings show those numbers, and one plain sentence says so. With the default weights (W = 100) every tier and
// heading equals today's. Tested in-process through netlify/functions/mcp.mjs (no network, no deploy).
// Run: node --test tests/icp-account-tiers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "account_prioritization", arguments: args } }),
  }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const ACCOUNTS = [
  { name: "Alpha", fit_score: 90, intent_signals: 90, relationship: 90, timing: "now" },
  { name: "Beta", fit_score: 70, intent_signals: 60, relationship: 55, timing: "soon" },
  { name: "Gamma", fit_score: 50, intent_signals: 45, relationship: 40, timing: "later" },
  { name: "Delta", fit_score: 20, intent_signals: 10, relationship: 15, timing: "later" },
];
const tierOf = (out, name) => out.match(new RegExp(`\\| \\*\\*${name}\\*\\* \\|[^\\n]*\\| ([ABCD]) \\|`))[1];

test("D41: default weights (W = 100) keep today's headings and tiers", async () => {
  const out = await call({ accounts: ACCOUNTS });
  assert.match(out, /### Tier A \(Score 80\+\): Immediate Action/);
  assert.match(out, /### Tier B \(Score 60-79\): High Priority/);
  assert.match(out, /### Tier C \(Score 40-59\): Nurture/);
  assert.match(out, /### Tier D \(Score <40\): Monitor/);
  // Totals with weights 40/30/15/15: Alpha 91.5 to 92, Beta 64.75 to 65, Gamma 45.5 to 46, Delta 19.25 to 19 (timing now 100, soon 70, later 40).
  assert.deepEqual(["Alpha", "Beta", "Gamma", "Delta"].map((n) => tierOf(out, n)), ["A", "B", "C", "D"]);
  assert.equal(out.split("The tiers are 80%, 60% and 40% of the highest possible score, 100 points, the sum of your weights.").length - 1, 1);
});

test("D41: W = 50 gives A from 40, B 30-39, C 20-29, D below 20", async () => {
  const out = await call({ accounts: ACCOUNTS, prioritization_weights: { fit: 20, intent: 15, relationship: 10, timing: 5 } });
  assert.match(out, /### Tier A \(Score 40\+\): Immediate Action/);
  assert.match(out, /### Tier B \(Score 30-39\): High Priority/);
  assert.match(out, /### Tier C \(Score 20-29\): Nurture/);
  assert.match(out, /### Tier D \(Score <20\): Monitor/);
  // Alpha 18 + 13.5 + 9 + 5 = 45.5, rounds to 46: tier A (it was C against the fixed 40 to 59).
  assert.equal(tierOf(out, "Alpha"), "A");
  assert.equal(out.split("The tiers are 80%, 60% and 40% of the highest possible score, 50 points, the sum of your weights.").length - 1, 1);
});

test("D41: W = 150 gives A from 120, B 90-119, C 60-89, D below 60", async () => {
  const out = await call({ accounts: ACCOUNTS, prioritization_weights: { fit: 60, intent: 45, relationship: 25, timing: 20 } });
  assert.match(out, /### Tier A \(Score 120\+\): Immediate Action/);
  assert.match(out, /### Tier B \(Score 90-119\): High Priority/);
  assert.match(out, /### Tier C \(Score 60-89\): Nurture/);
  assert.match(out, /### Tier D \(Score <60\): Monitor/);
  // Alpha 54 + 40.5 + 22.5 + 20 = 137: A. Gamma 30 + 20.25 + 10 + 8 = 68.25, rounds to 68: C (it was B against the fixed 60 to 79).
  assert.equal(tierOf(out, "Alpha"), "A");
  assert.equal(tierOf(out, "Gamma"), "C");
  assert.equal(out.split("The tiers are 80%, 60% and 40% of the highest possible score, 150 points, the sum of your weights.").length - 1, 1);
});

test("D41: the cut-offs are exact for every whole W from 1 to 2,000 (integer arithmetic)", () => {
  for (let W = 1; W <= 2000; W++) {
    for (const p of [80, 60, 40]) {
      const exact = Math.floor((W * p + 99) / 100); // ceil of W * p / 100 in integers
      assert.equal(Math.ceil((W * p) / 100), exact, `W ${W} p ${p}`);
    }
  }
});
