// Run 15 D38 (owner decision, 30 September 2026) and Codex C-ICP-01: a money figure or count that would print as a raw float
// (6 or more decimal places, or an artifact such as 0.026999999999999996) is rounded for display only; money gets 2 decimals.
// A count that rounds to 0 from a positive value prints "fewer than 1 (rounds to 0)". The calculation, every preset and every
// other printed number stay the same. Fixture from Claude chat's re-measure: 1 company at $1.
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: node --test tests/icp-display-rounding.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "tam_sam_som_calculator", arguments: args } }),
  }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const RAW = /\d\.\d{6,}/;
const fixture = (f) => readFileSync(new URL(`fixtures/${f}`, import.meta.url), "utf8");

test("D38: 1 company at $1 prints no raw float; pipeline $0.03", async () => {
  const out = await call({ total_potential_companies: 1, average_contract_value: 1 });
  assert.doesNotMatch(out, RAW);
  assert.match(out, /- \*\*Pipeline Required\*\*: \$0\.03 \(at 33% win rate\)/);
  // unchanged figures: TAM $1, SAM $0.3, SOM $0.009 (3 decimals, not a raw float)
  assert.match(out, /### \*\*TAM = \$1\*\*/);
  assert.match(out, /### \*\*SAM = \$0\.3\*\*/);
  assert.match(out, /### \*\*SOM = \$0\.009\*\*/);
});

test("D38: counts that round to 0 from a positive value say so", async () => {
  const out = await call({ total_potential_companies: 1, average_contract_value: 1 });
  assert.match(out, /- \*\*Deals Needed\*\*: fewer than 1 \(rounds to 0\) closed customers/);
  assert.match(out, /- \*\*Monthly Target\*\*: fewer than 1 \(rounds to 0\) deals\/month/);
  assert.match(out, /\| Year 1 \| [^\n]*\| fewer than 1 \(rounds to 0\) \|/);
  assert.match(out, /\| Year 3 \| [^\n]*\| fewer than 1 \(rounds to 0\) \|/);
  assert.match(out, /requiring \*\*fewer than 1 \(rounds to 0\) customers\*\*/);
  assert.doesNotMatch(out, /~0 /);
  // 40 companies at $900: 0.36 deals, which rounds to 0 from a positive value (today it printed "~0 closed customers")
  const small = await call({ total_potential_companies: 40, average_contract_value: 900 });
  assert.match(small, /- \*\*Deals Needed\*\*: fewer than 1 \(rounds to 0\) closed customers/);
});

test("D38: ordinary inputs are byte-identical to version 1.2.11", async () => {
  assert.equal(await call({ total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 30, year1_market_share_target: 2, segment_name: "Clinic groups" }), fixture("tam-ordinary-1.2.11.md"));
  assert.equal(await call({ total_potential_companies: 400, average_contract_value: 900 }), fixture("tam-small-1.2.11.md"));
});
