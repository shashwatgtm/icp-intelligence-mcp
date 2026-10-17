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
  assert.match(out, /- \*\*Pipeline Required\*\*: \$0\.03 \(SOM × 3, a 1 in 3 win rate\)/);
  // TAM $1 unchanged; run 16 N2 (D50): money under $1 prints 2 decimals, so SAM $0.3 is $0.30 and SOM $0.009 is $0.01
  assert.match(out, /### \*\*TAM = \$1\*\*/);
  assert.match(out, /### \*\*SAM = \$0\.30\*\*/);
  assert.match(out, /### \*\*SOM = \$0\.01\*\*/);
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

// Run 19 R19-35 (D80): the only text changes since 1.2.11 in these two answers; every figure is unchanged.
// Run 20 round 1 (quality): two label changes more, both text only: the segment line (the segment name does not say what you sell) and
// the ACV line names the unit (annual contract value). Every figure is unchanged.
const run19 = (t, segment) => t.replace(/^(## Market: [^\n]*\n)/m, `$1\n- **Company**: not given (add the company input to name your company or product in this answer)\n\n*Sector notes: none. This calculator takes a market segment, not a product; give product_category to the other ICP tools for notes that fit what you sell.*\n`)
  .replace("(at 33% win rate)", "(SOM × 3, a 1 in 3 win rate)")
  .replace(segment[0], segment[1]).replace(segment[0].toLowerCase(), segment[1].toLowerCase());
test("D38: ordinary inputs keep every figure of version 1.2.11 (run 19: only the labels named here change)", async () => {
  const ord = run19(fixture("tam-ordinary-1.2.11.md"), ["Clinic groups", "Mid-size manufacturers"])
    .replace("2. **ACV assumption**: Based on current pricing, may increase with enterprise deals", "2. **ACV**: $24,000, your input, read as annual contract value; check it against your last closed deals in this segment")
    .replace("4. **Market share**: 2.0% is conservative for Year 1", "4. **Market share**: 2.0% of SAM in Year 1 means ~30 new customers; check that number against the deals your team closed last year");
  assert.equal(await call({ total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 30, year1_market_share_target: 2, segment_name: "Mid-size manufacturers" }), ord);
  // run 16 D47: a figure in thousands shows one decimal when it is not a whole thousand; these are the only changes
  const d47 = run19(fixture("tam-small-1.2.11.md"), ["Target Market", "Target Market"]).replaceAll("$3K", "$3.2K").replace("       $3.2K               ", "       $3.2K             ")
    .replace("**Pipeline Required**: $10K", "**Pipeline Required**: $9.7K").replace("| $6K |", "| $6.5K |")
    .replace("2. **ACV assumption**: Based on current pricing, may increase with enterprise deals", "2. **ACV**: $900, your input, read as annual contract value; check it against your last closed deals in this segment")
    .replace("4. **Market share**: 3.0% (Example figure: replace with your own) is conservative for Year 1", "4. **Market share**: 3.0% (Example figure: replace with your own) of SAM in Year 1 means ~4 new customers; check that number against the deals your team closed last year");
  assert.equal(await call({ total_potential_companies: 400, average_contract_value: 900 }), d47);
});
