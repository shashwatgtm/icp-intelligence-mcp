// Run 20 round 1, task B (ledger A17-O24 and the number fix): every percentage a tool prints is a clean figure, at most one
// decimal and no float noise (33.333333%, 99.99999999999999 points). One test per tool feeds awkward numbers and asserts that no
// printed percentage has more than one decimal. The one exception is the run 17 D56 rule: a market share under 0.05% prints with
// two decimals at most (0.03%), never as 0.0%; it is tested on its own below.
// The ledger text fixes (A17-O24) are tested at the end: the descriptions in tools/list.
// Companies are invented (Spendrill, Lanehop, Branchwire); every figure is hypothetical.
// Run: node --test tests/run20-percent-round.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const MORE_THAN_ONE_DECIMAL = /\d[.,]\d{2,}\s*%/;
const FLOAT_NOISE = /\d\.\d{6,}|\d{3,}e[+-]\d|\bNaN\b|\bInfinity\b|\bundefined\b/;
const clean = (r) => {
  assert.equal(r.isError, false, r.text.slice(0, 300));
  assert.doesNotMatch(r.text, MORE_THAN_ONE_DECIMAL, "a percentage with more than one decimal");
  assert.doesNotMatch(r.text, FLOAT_NOISE, "float noise");
};

test("icp_deep_dive: shares of 7 customers (1/7, 2/7, 4/7) print as whole percentages", async () => {
  const customers = [
    ...Array.from({ length: 4 }, (_, i) => ({ name: `Lanehop ${i}`, industry: "Manufacturing", size: "300-1000 employees", acv: 24000 + i * 1111, sales_cycle_days: 61, tech_stack: ["SAP"], buying_trigger: "Audit finding", champion_title: "Finance Controller" })),
    ...Array.from({ length: 2 }, (_, i) => ({ name: `Branchwire ${i}`, industry: "IT services", size: "1000-3000 employees", acv: 96000, sales_cycle_days: 90, tech_stack: ["Oracle"], buying_trigger: "New CFO", champion_title: "Head of Finance" })),
    { name: "Spendrill", industry: "Distribution", size: "50-200 employees", acv: 9999.99, sales_cycle_days: 33, tech_stack: [], buying_trigger: "Growth", champion_title: "Owner" },
  ];
  const r = await call("icp_deep_dive", { customers, product_category: "spend management software" });
  clean(r);
  assert.match(r.text, /\(57%\)/);
  assert.match(r.text, /\(29%\)/);
  assert.match(r.text, /\(14%\)/);
});

test("icp_scoring_model: odd weights and a success pattern give no long percentage", async () => {
  const r = await call("icp_scoring_model", {
    scoring_criteria: [
      { criterion: "ERP in use", importance: "critical", values: ["Yes", "Partly", "No"] },
      { criterion: "Branches", importance: "important", values: ["10 or more", "3 to 9", "1 or 2", "none"] },
      { criterion: "Finance team size", importance: "nice_to_have", values: ["Large", "Small", "One person"] },
    ],
    success_correlation: "Deals with a finance controller champion close faster",
    product_category: "spend management software",
  });
  clean(r);
});

test("buyer_group_analyzer: odd deal and company sizes give no long percentage", async () => {
  const r = await call("buyer_group_analyzer", {
    product_category: "spend management software", deal_size: "$33,333 to $66,667", target_company_size: "333-1,667 employees",
    known_stakeholders: ["Chief Financial Officer", "Finance Controller", "Head of IT"], typical_champion: "Finance Controller",
  });
  clean(r);
});

test("tam_sam_som_calculator: awkward rates print as clean figures with one decimal at most", async () => {
  for (const [icp, share] of [[33.333333, 1.23456], [12.5, 2.675], [7.07070707, 0.1], [99.99999, 33.333333], [0.3333333, 0.0505], [66.666666, 4.4444444]]) {
    const r = await call("tam_sam_som_calculator", { total_potential_companies: 19999, average_contract_value: 1234.5678, icp_percentage: icp, year1_market_share_target: share, segment_name: "Branchwire segment" });
    clean(r);
  }
});

test("tam_sam_som_calculator: an ICP rate of 12.5 prints as 12.5% (it was rounded to 13% while the sum used 12.5)", async () => {
  const r = await call("tam_sam_som_calculator", { total_potential_companies: 1000, average_contract_value: 1000, icp_percentage: 12.5, year1_market_share_target: 3 });
  clean(r);
  assert.match(r.text, /\| ICP Match Rate \| 12\.5% \| Your input \|/);
  assert.match(r.text, /SAM = \$1\.0M × 12\.5%/);
  assert.match(r.text, /SAM = \$125K/);
  const r2 = await call("tam_sam_som_calculator", { total_potential_companies: 1000, average_contract_value: 1000, icp_percentage: 30, year1_market_share_target: 3 });
  assert.match(r2.text, /\| ICP Match Rate \| 30% \| Your input \|/, "a whole rate prints without a decimal, as before");
});

test("tam_sam_som_calculator: a share under 0.05% keeps the run 17 rule (two decimals at most, never 0.0%)", async () => {
  const t = async (share) => (await call("tam_sam_som_calculator", { total_potential_companies: 1000, average_contract_value: 1000, icp_percentage: 30, year1_market_share_target: share })).text;
  const a = await t(0.03);
  assert.match(a, /\| Year 1 Market Share Target \| 0\.03% \|/);
  const b = await t(0.0123);
  assert.match(b, /\| Year 1 Market Share Target \| 0\.01% \|/);
  assert.doesNotMatch(b, /\d\.\d{3,}\s*%/);
  const c = await t(0.0004);
  assert.match(c, /\| Year 1 Market Share Target \| under 0\.01% \|/);
  assert.doesNotMatch(c, /\d\.\d{3,}\s*%/);
});

test("lookalike_signal_generator: odd inputs give no long percentage", async () => {
  const r = await call("lookalike_signal_generator", {
    champion_titles: ["Finance Controller"], icp_firmographics: { industries: ["Manufacturing"], company_sizes: ["333-1,667"], locations: ["India"], funding_stages: ["Series B"] },
    icp_technographics: ["SAP"], buying_triggers: ["Audit finding", "New CFO"], product_category: "spend management software",
  });
  clean(r);
});

test("account_prioritization: weights of 33.333333 print as 33.3% and the sum of weights has no float noise", async () => {
  const accounts = [
    { name: "Lanehop", fit_score: 83.3333333, intent_signals: 66.6666667, relationship: 14.2857142, timing: "soon" },
    { name: "Branchwire", fit_score: 45.4545454, intent_signals: 90, relationship: 71.4285714, timing: "now" },
    { name: "Spendrill", fit_score: 20, intent_signals: 10, relationship: 5, timing: "later" },
  ];
  const r = await call("account_prioritization", { accounts, prioritization_weights: { fit: 33.333333, intent: 33.333333, relationship: 16.666667, timing: 16.666667 } });
  clean(r);
  assert.match(r.text, /\| \*\*Fit\*\* \| 33\.3% \|/);
  assert.match(r.text, /\| \*\*Relationship\*\* \| 16\.7% \|/);
  assert.match(r.text, /× 33\.3% = /);
  const r2 = await call("account_prioritization", { accounts, prioritization_weights: { fit: 33.3, intent: 33.3, relationship: 33.3, timing: 0.1 } });
  clean(r2);
  assert.match(r2.text, /the highest possible score, 100 points/);
  assert.match(r2.text, /### Tier A \(Score 80\+\)/, "the cut-offs are 80, 60 and 40 of 100, not 81 from a sum of 100.00000000000001");
});

test("account_prioritization: whole-number weights print exactly as before", async () => {
  const r = await call("account_prioritization", { accounts: [{ name: "Lanehop", fit_score: 80, intent_signals: 70, relationship: 60, timing: "now" }], prioritization_weights: { fit: 40, intent: 30, relationship: 15, timing: 15 } });
  assert.match(r.text, /\| \*\*Fit\*\* \| 40% \|/);
  assert.match(r.text, /the highest possible score, 100 points/);
});

test("icp_gap_analysis: win and churn rates of 23.456789 print with one decimal at most", async () => {
  const r = await call("icp_gap_analysis", {
    current_customers: "Mid-size manufacturers with 300 to 1,000 employees", ideal_icp: "Distributors with 1,000 to 3,000 employees and many branches",
    current_metrics: { avg_acv: 24000, avg_sales_cycle: 91, win_rate: 23.456789, churn_rate: 11.111111, nps: 31 },
    target_metrics: { avg_acv: 51234, avg_sales_cycle: 59, win_rate: 31.234567, churn_rate: 7.777777, nps: 52 },
  });
  clean(r);
  assert.match(r.text, /\| \*\*Win Rate\*\* \| 23\.5% \| 31\.2% \|/);
  assert.match(r.text, /\| \*\*Churn Rate\*\* \| 11\.1% \| 7\.8% \|/);
  const r2 = await call("icp_gap_analysis", { current_customers: "a", ideal_icp: "b", current_metrics: { win_rate: 20, churn_rate: 15 }, target_metrics: { win_rate: 30, churn_rate: 8 } });
  assert.match(r2.text, /\| 20% \| 30% \|/, "whole rates print without a decimal, as before");
});

test("icp_evolution_tracker: odd inputs give no long percentage", async () => {
  const r = await call("icp_evolution_tracker", {
    current_icp: "Mid-size manufacturers with 300 to 1,000 employees", recent_wins: "IT services firms with heavy travel spend; distributors with 33.3 branches",
    recent_losses: "ERP-only buyers who wanted one suite", market_changes: "A competitor cut prices", time_period: "last quarter",
  });
  clean(r);
});

test("icp_interview_synthesizer: 3 of 7 interviews (42.857...) prints 43%", async () => {
  const mk = (i, role, pain) => ({ customer: `Branchwire ${i}`, role, pain_points: [pain], buying_triggers: ["Audit finding"], value_realized: ["Close 5 days faster"], key_quotes: ["It took a week"] });
  const interview_notes = [
    mk(1, "Finance Controller", "Slow month-end close"), mk(2, "Finance Controller", "Slow month-end close"), mk(3, "Finance Controller", "Slow month-end close"),
    mk(4, "Head of Finance", "Manual reconciliation"), mk(5, "Head of Finance", "Late expense claims"), mk(6, "Owner", "Late expense claims"), mk(7, "Owner", "Slow month-end close"),
  ];
  const r = await call("icp_interview_synthesizer", { interview_notes, product_category: "spend management software" });
  clean(r);
  assert.match(r.text, /in 4 of 7 interviews \(57%\)/);   // run 20 round 1: "in k of n interviews" replaces "mentioned kx (p% of interviews)"
  assert.match(r.text, /\*\*Finance Controller\*\*: in 3 of 7 interviews \(43%\)/);
});

// ---- Ledger A17-O24: the hints in tools/list ----
const listTools = async () => Object.fromEntries((await rpc("tools/list", {})).result.tools.map((t) => [t.name, t]));

test("A17-O24: the interview synthesizer hint says what the tool does with pasted notes", async () => {
  const t = await listTools();
  const hint = t.icp_interview_synthesizer.inputSchema.properties.raw_transcripts.description;
  assert.doesNotMatch(hint, /^Alternative: Paste raw interview transcripts or notes$/);
  assert.match(hint, /does not analy[sz]e pasted text/i);
  assert.match(hint, /interview_notes/);
  assert.match(hint, /500 characters/);
  // and the tool really does that: it shows the first 500 characters back and does not analyze them
  const long = "We lost a week every month. ".repeat(60);
  const r = await call("icp_interview_synthesizer", { raw_transcripts: long });
  assert.match(r.text, /This tool analyzes structured notes only/);
  assert.match(r.text, /first 4\d\d of 1,679 characters/);
});

test("A17-O24: the evolution tracker hint has no year", async () => {
  const t = await listTools();
  const hint = t.icp_evolution_tracker.inputSchema.properties.time_period.description;
  assert.doesNotMatch(hint, /\b(19|20)\d\d\b/);
  assert.doesNotMatch(hint, /\bQ[1-4]\b/);
  assert.match(hint, /last quarter/);
});

test("A17-O24: one spelling, analyze, in the tool texts", async () => {
  const t = await listTools();
  const all = JSON.stringify(Object.values(t));
  assert.doesNotMatch(all, /analys(?:e|ed|es|ing)\b/i);
  const r = await call("icp_interview_synthesizer", { raw_transcripts: "x" });
  assert.doesNotMatch(r.text, /\banalys(?:e|ed|es)\b/i);
  const d = await call("icp_deep_dive", { customer_descriptions: "Mid-size manufacturers, several of which differ", product_category: "x" });
  assert.doesNotMatch(d.text, /\bspecialise\b/i);
});

test("A17-O24: the TAM icp_percentage hint and schema agree with what the code accepts (0 to 100)", async () => {
  const t = await listTools();
  const p = t.tam_sam_som_calculator.inputSchema.properties;
  assert.equal(p.icp_percentage.minimum, 0);
  assert.equal(p.icp_percentage.maximum, 100);
  assert.doesNotMatch(p.icp_percentage.description, /1-100/);
  assert.match(p.icp_percentage.description, /0 to 100/);
  assert.equal(p.year1_market_share_target.maximum, 100);
  const base = { total_potential_companies: 100, average_contract_value: 1000 };
  assert.equal((await call("tam_sam_som_calculator", { ...base, icp_percentage: 0 })).isError, false, "0 is accepted");
  assert.equal((await call("tam_sam_som_calculator", { ...base, icp_percentage: 100 })).isError, false, "100 is accepted");
  const over = await call("tam_sam_som_calculator", { ...base, icp_percentage: 100.5 });
  assert.equal(over.isError, true);
  assert.match(over.text, /icp_percentage must be 100 or less/);
  assert.equal((over.text.match(/icp_percentage must be 100 or less/g) || []).length, 1, "the refusal names the problem once");
  assert.equal((await call("tam_sam_som_calculator", { ...base, icp_percentage: -1 })).isError, true);
});

test("A17-O24: the account_prioritization hints give the relationship and timing ranges", async () => {
  const t = await listTools();
  const a = t.account_prioritization.inputSchema.properties.accounts;
  assert.match(a.description, /relationship \(0 to 100\)/);
  assert.match(a.description, /timing \(now, soon, later or unknown\)/);
  const item = a.items.properties;
  assert.match(item.relationship.description, /0 to 100/);
  assert.match(item.fit_score.description, /0 to 100/);
  assert.match(item.intent_signals.description, /0 to 100/);
  assert.doesNotMatch(item.intent_signals.description, /0 if unknown/);
  assert.match(item.timing.description, /now, soon, later or unknown/);
  for (const k of ["fit_score", "intent_signals", "relationship"]) assert.doesNotMatch(item[k].description, /^1-100/);
  // what the code does with the ranges: 0 is used as 0, over 100 is refused, an unknown timing word counts as unknown (50 points)
  const ok = await call("account_prioritization", { accounts: [{ name: "Lanehop", fit_score: 0, intent_signals: 0, relationship: 0, timing: "whenever" }] });
  assert.equal(ok.isError, false);
  assert.match(ok.text, /whenever \(50 pts\)/);
  assert.equal((await call("account_prioritization", { accounts: [{ name: "Lanehop", relationship: 101 }] })).isError, true);
});
