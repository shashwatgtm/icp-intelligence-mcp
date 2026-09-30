// Run 15 R15-32: fixes from the edge-case matrix (evidence/run15/matrix/, triage independent-audit/run15/matrix-triage.md).
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: node --test tests/matrix-fixes.test.mjs
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

test("tam_sam_som_calculator: percentages over 100 are refused in plain words", async () => {
  const r = await call("tam_sam_som_calculator", { total_potential_companies: 5000, average_contract_value: 24000, icp_percentage: 150, year1_market_share_target: 120 });
  assert.equal(r.isError, true);
  assert.match(r.text, /icp_percentage must be 100 or less/);
  assert.match(r.text, /year1_market_share_target must be 100 or less/);
});

test("tam_sam_som_calculator: very large figures print with separators and never an exponent", async () => {
  const r = await call("tam_sam_som_calculator", { total_potential_companies: 1000000000000, average_contract_value: 1000000000000, icp_percentage: 30, year1_market_share_target: 3 });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /e\+\d/);
  assert.doesNotMatch(r.text, /\d{7,}\.\d\dB/);
  assert.match(r.text, /### \*\*TAM = \$1,000,000,000,000,000\.00B\*\*/);
});

test("account_prioritization: a score over 100 is refused in plain words", async () => {
  const r = await call("account_prioritization", { accounts: [{ name: "Alpha", fit_score: 850, intent_signals: 60, relationship: 40, timing: "soon" }] });
  assert.equal(r.isError, true);
  assert.match(r.text, /accounts\[0\]\.fit_score must be 100 or less/);
});

test("icp_gap_analysis: a rate over 100 is refused; a metric with no gap says so instead of listing causes", async () => {
  const bad = await call("icp_gap_analysis", { current_customers: "Clinics", ideal_icp: "Clinic groups", current_metrics: { win_rate: 1000 } });
  assert.equal(bad.isError, true);
  assert.match(bad.text, /current_metrics\.win_rate must be from 0 to 100/);
  const r = await call("icp_gap_analysis", { current_customers: "Clinics", ideal_icp: "Clinic groups",
    current_metrics: { avg_acv: 20000, avg_sales_cycle: 40, win_rate: 20, churn_rate: 10, nps: 30 },
    target_metrics: { avg_acv: 30000, avg_sales_cycle: 45, win_rate: 20, churn_rate: 8, nps: 40 } });
  const cycle = r.text.split("### Sales Cycle Gap")[1].split("### Win Rate Gap")[0];
  assert.match(cycle, /No gap: you are at or better than your target on this metric, so there is nothing to fix here\./);
  assert.doesNotMatch(cycle, /Common causes to check/);
  const win = r.text.split("### Win Rate Gap")[1].split("### Churn Gap")[0];
  assert.match(win, /^ \(target met, no change needed\)/);
  assert.doesNotMatch(r.text, /-0%/);
  const acv = r.text.split("### ACV Gap")[1].split("### Sales Cycle Gap")[0];
  assert.match(acv, /Common causes to check/);
});

test("icp_scoring_model: a criterion with no values says so", async () => {
  const r = await call("icp_scoring_model", { scoring_criteria: [{ criterion: "Budget", importance: "critical", values: [] }] });
  assert.match(r.text, /\| \*\*Budget\*\* \| [0-9]+ pts \| \[no values supplied: add the values you score\] \|/);
});

test("lookalike_signal_generator: an empty list is treated like a list left out", async () => {
  const r = await call("lookalike_signal_generator", { champion_titles: ["Operations Director"], icp_technographics: [], buying_triggers: [] });
  assert.doesNotMatch(r.text, /Technologies: \n/);
  assert.match(r.text, /\*\*Technologies\*\*: Salesforce, HubSpot \(not supplied: example values\)/);
});
