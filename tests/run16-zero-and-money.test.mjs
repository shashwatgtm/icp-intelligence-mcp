// Run 16 (owner decisions D45, D47 and D50 N2, 30 September 2026). Tested in-process through netlify/functions/mcp.mjs.
// N2 (D50): money under $1 prints 2 decimals; a positive amount that rounds to $0.00 prints "under $0.01".
// D47: a figure in thousands shows one decimal when it is not a whole thousand ($2,400 as "$2.4K"; $2,000 stays "$2K").
// D45: a typed 0 is used as 0: tam_sam_som_calculator icp_percentage and year1_market_share_target; account_prioritization
// account scores and weights (all four weights 0 is refused in plain words); icp_gap_analysis rates (already used as 0).
// Omitted and null keep today's presets and defaults. Run: npm test
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
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const EX = "(Example figure: replace with your own)";

test("N2: sub-dollar money prints 2 decimals (run15-review.md N2 fixture)", async () => {
  const r = await call("tam_sam_som_calculator", { total_potential_companies: 10, average_contract_value: 10, icp_percentage: 30, year1_market_share_target: 0.03 });
  assert.match(r.text, /### \*\*SOM = \$0\.01\*\*/);
  assert.match(r.text, /\| Year 1 \| [^|]+ \| \$0\.01 \|/);
  assert.match(r.text, /\| Year 2 \| [^|]+ \| \$0\.02 \|/);
  assert.match(r.text, /\| Year 3 \| [^|]+ \| \$0\.04 \|/);
  assert.match(r.text, /Pipeline Required\*\*: \$0\.03 /);
  assert.doesNotMatch(r.text, /\$0\.\d{3}/);
});

test("N2: a positive amount that rounds to $0.00 prints under $0.01", async () => {
  const r = await call("tam_sam_som_calculator", { total_potential_companies: 1, average_contract_value: 1, icp_percentage: 1, year1_market_share_target: 0.1 });
  assert.match(r.text, /### \*\*SOM = under \$0\.01\*\*/);
  assert.doesNotMatch(r.text, /\$0\.00\b/);
});

test("N2: the run 15 D38 fixture keeps $0.03 and whole-dollar figures stay as they are", async () => {
  const r = await call("tam_sam_som_calculator", { total_potential_companies: 1, average_contract_value: 1 });
  assert.match(r.text, /Pipeline Required\*\*: \$0\.03 /);
  assert.match(r.text, /### \*\*TAM = \$1\*\*/);
});

test("D47: a figure in thousands shows one decimal when it is not a whole thousand", async () => {
  const a = await call("tam_sam_som_calculator", { total_potential_companies: 10, average_contract_value: 240 });
  assert.match(a.text, /### \*\*TAM = \$2\.4K\*\*/);
  const b = await call("tam_sam_som_calculator", { total_potential_companies: 10, average_contract_value: 200 });
  assert.match(b.text, /### \*\*TAM = \$2K\*\*/);
});

test("D45: icp_percentage 0 is used as 0 (SAM $0), omitted and null keep the 30% preset", async () => {
  const z = await call("tam_sam_som_calculator", { total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 0, year1_market_share_target: 3 });
  assert.match(z.text, /\| ICP Match Rate \| 0% \| Your input \|/);
  assert.match(z.text, /### \*\*SAM = \$0\*\*/);
  assert.match(z.text, /### \*\*SOM = \$0\*\*/);
  for (const v of [undefined, null]) {
    const r = await call("tam_sam_som_calculator", { total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: v, year1_market_share_target: 3 });
    assert.ok(r.text.includes(`| ICP Match Rate | 30% ${EX} | Not supplied |`), String(v));
  }
  const o = await call("tam_sam_som_calculator", { total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 25, year1_market_share_target: 3 });
  assert.match(o.text, /\| ICP Match Rate \| 25% \| Your input \|/);
});

test("D45: year1_market_share_target 0 is used as 0 (SOM $0, 0 customers), omitted and null keep the 3% preset", async () => {
  const z = await call("tam_sam_som_calculator", { total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 30, year1_market_share_target: 0 });
  assert.match(z.text, /\| Year 1 Market Share Target \| 0\.0% \| Your input \|/);
  assert.match(z.text, /### \*\*SOM = \$0\*\*/);
  assert.match(z.text, /Deals Needed\*\*: ~0 closed customers/);
  for (const v of [undefined, null]) {
    const r = await call("tam_sam_som_calculator", { total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 30, year1_market_share_target: v });
    assert.ok(r.text.includes(`| Year 1 Market Share Target | 3.0% ${EX} | Not supplied |`), String(v));
  }
});

const ACC = (over) => ({ name: "Clinic Group A", fit_score: 80, intent_signals: 60, relationship: 40, timing: "soon", ...over });

test("D45: account scores given as 0 are used as 0, not 50 (default); omitted and null keep the default", async () => {
  const z = await call("account_prioritization", { accounts: [ACC({ fit_score: 0, intent_signals: 0, relationship: 0 })] });
  assert.match(z.text, /\| 1 \| \*\*Clinic Group A\*\* \| 0 \| 0 \| 0 \| soon \| \*\*11\*\* \| D \|/);
  for (const v of [undefined, null]) {
    const r = await call("account_prioritization", { accounts: [ACC({ fit_score: v })] });
    assert.match(r.text, /\| \*\*Clinic Group A\*\* \| 50 \(default\) \| 60 \|/, String(v));
  }
  const o = await call("account_prioritization", { accounts: [ACC({})] });
  assert.match(o.text, /\| \*\*Clinic Group A\*\* \| 80 \| 60 \| 40 \| soon \| \*\*67\*\* \| B \|/);
});

test("D45: a weight given as 0 is used as 0 and the D41 tiers follow the new sum W", async () => {
  const r = await call("account_prioritization", { accounts: [ACC({})], prioritization_weights: { fit: 0, intent: 30, relationship: 15, timing: 15 } });
  assert.match(r.text, /\| \*\*Fit\*\* \| 0% \| How well they match ICP \|/);
  assert.match(r.text, /highest possible score, 60 points, the sum of your weights/);
  assert.match(r.text, /### Tier A \(Score 48\+\)/);
  for (const v of [undefined, null]) {
    const d = await call("account_prioritization", { accounts: [ACC({})], prioritization_weights: { fit: v, intent: 30, relationship: 15, timing: 15 } });
    assert.ok(d.text.includes(`| **Fit** | 40% ${EX} |`), String(v));
    assert.match(d.text, /highest possible score, 100 points/);
  }
});

test("D45: all four weights 0 are refused in plain words", async () => {
  const r = await call("account_prioritization", { accounts: [ACC({})], prioritization_weights: { fit: 0, intent: 0, relationship: 0, timing: 0 } });
  assert.equal(r.isError, true);
  assert.equal(r.text, "Invalid input for account_prioritization: at least one weight must be more than 0.");
});

test("D45: icp_gap_analysis rates given as 0 are used as 0 (standing check; already true in run 15)", async () => {
  const r = await call("icp_gap_analysis", { current_customers: "Clinic groups with 5 to 20 locations", ideal_icp: "Clinic groups with 20 or more locations",
    current_metrics: { win_rate: 0, churn_rate: 0, nps: 0 }, target_metrics: { win_rate: 30, churn_rate: 8, nps: 50 } });
  assert.match(r.text, /\| \*\*Win Rate\*\* \| 0% \| 30% \|/);
  assert.match(r.text, /\| \*\*Churn Rate\*\* \| 0% \| 8% \|/);
  assert.match(r.text, /\| \*\*NPS\*\* \| 0 \| 50 \| \+50 points needed \|/);
});
