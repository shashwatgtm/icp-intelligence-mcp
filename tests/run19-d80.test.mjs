// Run 19 R19-35 (owner decision D80): the 8 problems of the real-world test, fixed in every ICP Intelligence tool,
// plus the ledger rows B15-L1, B15-L4, B15-L5h and B16-17. Written before the fixes (B43); run on the starting head
// 4383561d first, where these tests fail.
// Companies are only the invented ones of the run 19 examples (Spendrill, Cloudmoat, Lanehop, Branchwire, Answerloop,
// Shelfwalk, Example Manufacturing Co, Example IT Services Co, Example Logistics Co); real companies are tested only in the
// private project repo (rule B81).
// Run: node --test tests/run19-d80.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
const B75 = /\b(clinics?|patients?|hospitals?|healthcare|hipaa|ehr|appointments?|no-shows?|dental|physio\w*|ExampleCo|Example Co|Acme Notes|Clausewise|ClinicFlow|legal tech)\b/i;
const PROMISES = /guaranteed|price protection|no long-term commitment/i;
const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
const TEMPLATE = /\[Your (?!name\])|\[Insert|\{\{|\bundefined\b|\bNaN\b|XX%/;
// The checks every answer must pass: no error, names the company, no B75 word, no invented promise, no unfilled marker.
const common = (r, company) => {
  assert.equal(r.isError, false, r.text.slice(0, 300));
  assert.ok(r.text.includes(company), `names ${company}`);
  assert.doesNotMatch(r.text, B75);
  assert.doesNotMatch(r.text, PROMISES);
  assert.doesNotMatch(r.text, TEMPLATE);
};

const SPENDRILL = "Spendrill";
const deepDiveText = { company: SPENDRILL, product_category: "spend management software",
  customer_descriptions: "Mid-size manufacturers with 300 to 3,000 employees and large field sales teams; the finance controller buys and the pain is a slow month-end close. Also IT services firms with heavy travel spend, and distributors with many branches." };
const deepDiveData = { company: SPENDRILL, product_category: "spend management software", customers: [
  { name: "Example Manufacturing Co", industry: "Manufacturing", size: "300-1000 employees", acv: 24000, sales_cycle_days: 60, tech_stack: ["SAP"], buying_trigger: "audit finding", champion_title: "Finance Controller" },
  { name: "Example IT Services Co", industry: "IT services", size: "1000-3000 employees", acv: 36000, sales_cycle_days: 75, tech_stack: ["Oracle NetSuite"], buying_trigger: "new CFO hire", champion_title: "Head of Accounts Payable" },
  { name: "Example Logistics Co", industry: "Logistics", size: "3000-5000 employees", acv: 96000, sales_cycle_days: 90, tech_stack: ["SAP"], buying_trigger: "ERP migration", champion_title: "Finance Controller" } ] };

// Problem 1: no clinic text anywhere in the tool code or the tool descriptions
test("problem 1: no clinic or dummy-company word in src/ or in tools/list", async () => {
  for (const f of ["../src/index.ts", "../src/verticals.ts"]) assert.doesNotMatch(readFileSync(new URL(f, import.meta.url), "utf8"), B75, f);
  const tl = await rpc("tools/list", {});
  assert.doesNotMatch(JSON.stringify(tl.result.tools), B75);
});

test("every tool takes an optional company input and names it; business_model where advice depends on the model", async () => {
  const tl = await rpc("tools/list", {});
  for (const t of tl.result.tools) {
    assert.ok(t.inputSchema.properties.company, `${t.name} has company`);
    assert.ok(!(t.inputSchema.required || []).includes("company"));
  }
  for (const n of ["icp_deep_dive", "buyer_group_analyzer", "icp_gap_analysis"]) {
    const t = tl.result.tools.find((x) => x.name === n);
    assert.deepEqual(t.inputSchema.properties.business_model.enum, ["saas", "services", "connectivity", "transactions", "marketplace", "hardware_software", "investment"]);
  }
});

// icp_deep_dive
test("icp_deep_dive (text): names the company, reads sizes and sector from the text, quotes it once, adds sector words", async () => {
  const r = await call("icp_deep_dive", deepDiveText);
  common(r, SPENDRILL);
  assert.match(r.text, /300 to 3,000 employees/);
  assert.match(r.text, /month-end close|reconciliation|audit trail|Finance Controller/i);
  assert.match(r.text, /fintech/i);
  assert.equal(r.text.split("Mid-size manufacturers with 300").length - 1, 1); // the text is shown once
});

test("icp_deep_dive (data): a tie is not called primary, budget is the range seen, no empty gaps heading", async () => {
  const r = await call("icp_deep_dive", deepDiveData);
  common(r, SPENDRILL);
  assert.doesNotMatch(r.text, /Primary segment: 300-1000 employees/);
  assert.match(r.text, /no single leading size/i);
  assert.match(r.text, /\*\*Budget\*\*: \$24,000 to \$96,000 ACV seen in your customers/);
  assert.doesNotMatch(r.text, /## Data Gaps to Fill\n\s*\n\s*\n\s*\n/);
  assert.match(r.text, /reconciliation|month-end close|Who usually decides/i);
});

test("icp_deep_dive: a services business gets no PLG or SaaS advice; a long text is cut once (B15-L1)", async () => {
  const r = await call("icp_deep_dive", { company: "Example IT Services Co", business_model: "services", customers: [
    { name: "Example Logistics Co", industry: "Logistics", size: "500-1000 employees", acv: 9000 },
    { name: "Example Manufacturing Co", industry: "Manufacturing", size: "500-1000 employees", acv: 11000 } ] });
  common(r, "Example IT Services Co");
  assert.doesNotMatch(r.text, /PLG|SAAS_ONLY/);
  assert.doesNotMatch(r.text, SAAS_ONLY);
  const long = "Our buyers are operations leaders at third-party logistics firms who run dispatch from spreadsheets. ".repeat(40);
  const t = await call("icp_deep_dive", { company: "Lanehop", customer_descriptions: long });
  common(t, "Lanehop");
  assert.ok(t.text.length < long.length + 3000, "the long text is not pasted whole");
  assert.match(t.text, /characters/);
});

// icp_scoring_model
test("icp_scoring_model: points per value, the correlation matched to a criterion, sector signals", async () => {
  const r = await call("icp_scoring_model", { company: SPENDRILL, product_category: "spend management software",
    success_correlation: "Customers with an ERP and a finance controller renew most",
    scoring_criteria: [{ criterion: "Number of employees", importance: "critical", values: ["300 to 3000", "100 to 299", "under 100"] },
      { criterion: "ERP in use", importance: "important", values: ["Yes", "No"] }] });
  common(r, SPENDRILL);
  assert.match(r.text, /300 to 3000 \(25 pts\) \/ 100 to 299 \(13 pts\) \/ under 100 \(0 pts\)/);
  assert.match(r.text, /Yes \(15 pts\) \/ No \(0 pts\)/);
  assert.match(r.text, /already a criterion: \*\*ERP in use\*\*/);
  assert.doesNotMatch(r.text, /Consider adding this as a criterion of your own/);
  assert.match(r.text, /Finance Controller|month-end close|reconciliation/i);
});

test("unit: points per value: first value full weight, last 0, even steps; one value scores full", async () => {
  const r = await call("icp_scoring_model", { company: "Cloudmoat", scoring_criteria: [
    { criterion: "Cloud accounts", importance: "nice_to_have", values: ["AWS", "Azure", "Google Cloud", "None"] },
    { criterion: "Audit due", importance: "critical", values: ["Yes"] }] });
  common(r, "Cloudmoat");
  assert.match(r.text, /AWS \(10 pts\) \/ Azure \(7 pts\) \/ Google Cloud \(3 pts\) \/ None \(0 pts\)/);
  assert.match(r.text, /Yes \(25 pts; 0 if not\)/);
  assert.match(r.text, /\*\*Maximum Score\*\*: 35 points/); // weights unchanged
});

// buyer_group_analyzer
test("buyer_group_analyzer: no clinic prompt, typed champion kept, stakeholders mapped, sector committee", async () => {
  const r = await call("buyer_group_analyzer", { company: SPENDRILL, product_category: "spend management software", deal_size: "$24,000 ACV",
    target_company_size: "300-3000 employees", typical_champion: "Finance Controller",
    known_stakeholders: ["Chief Financial Officer", "Head of Accounts Payable", "Internal Audit Lead", "Head of IT"] });
  common(r, SPENDRILL);
  assert.match(r.text, /### Champion[^\n]*\n\*\*Role\*\*: Finance Controller/);
  assert.match(r.text, /### Economic Buyer[^\n]*\n\*\*Role\*\*: Chief Financial Officer/);
  assert.match(r.text, /### Technical Evaluator[^\n]*\n\*\*Role\*\*: Head of IT/);
  assert.match(r.text, /Internal Audit Lead/);
  assert.match(r.text, /Head of Accounts Payable/);
  assert.match(r.text, /\$24,000 ACV/);
  assert.match(r.text, /month-end close|reconciliation|audit trail/i);
});

test("buyer_group_analyzer: a security product keeps the typed champion; no breach-cost statistic (B82)", async () => {
  const r = await call("buyer_group_analyzer", { company: "Cloudmoat", product_category: "cloud security monitoring", typical_champion: "Cloud Security Lead",
    known_stakeholders: ["CISO", "Head of DevOps", "CTO"] });
  common(r, "Cloudmoat");
  assert.match(r.text, /### Champion[^\n]*\n\*\*Role\*\*: Cloud Security Lead/);
  assert.match(r.text, /Head of DevOps/);
  assert.match(r.text, /CTO/);
  assert.doesNotMatch(r.text, /\$5M/);
  assert.doesNotMatch(r.text, /\$30K-50K|200-500 employees/); // no default figures in place of inputs not given
});

test("buyer_group_analyzer: a connectivity business gets no sandbox or trial advice", async () => {
  const r = await call("buyer_group_analyzer", { company: "Branchwire", product_category: "managed SD-WAN and business internet for companies with many branches",
    typical_champion: "Head of IT Infrastructure" });
  common(r, "Branchwire");
  assert.doesNotMatch(r.text, /sandbox|SAAS_ONLY/i);
  assert.doesNotMatch(r.text, SAAS_ONLY);
  assert.match(r.text, /site survey|pilot sites|uptime/i);
});

// tam_sam_som_calculator
test("tam_sam_som_calculator: Spendrill figures, no unsupported 'conservative', pipeline label matches x3, sector notes", async () => {
  const r = await call("tam_sam_som_calculator", { company: SPENDRILL, total_potential_companies: 9000, average_contract_value: 24000,
    icp_percentage: 25, year1_market_share_target: 1, segment_name: "Indian mid-size companies with an ERP, spend management for finance teams" });
  common(r, SPENDRILL);
  assert.match(r.text, /### \*\*TAM = \$216\.0M\*\*/);
  assert.match(r.text, /### \*\*SAM = \$54\.0M\*\*/);
  assert.match(r.text, /### \*\*SOM = \$540K\*\*/);
  assert.doesNotMatch(r.text, /conservative|aggressive/);
  assert.doesNotMatch(r.text, /may increase with enterprise deals/);
  assert.match(r.text, /Pipeline Required\*\*: \$1\.6M \(SOM × 3, a 1 in 3 win rate\)/);
});

test("unit B16-17: $999,950 prints as $1.0M, not $1000K; an amount under 1,000 that is not whole prints 2 decimals", async () => {
  const a = await call("tam_sam_som_calculator", { company: SPENDRILL, total_potential_companies: 19999, average_contract_value: 50, icp_percentage: 100, year1_market_share_target: 100 });
  assert.match(a.text, /### \*\*TAM = \$1\.0M\*\*/);
  assert.doesNotMatch(a.text, /1000K/);
  const b = await call("tam_sam_som_calculator", { company: SPENDRILL, total_potential_companies: 1, average_contract_value: 64.8 });
  assert.match(b.text, /### \*\*TAM = \$64\.80\*\*/);
  const c = await call("tam_sam_som_calculator", { company: SPENDRILL, total_potential_companies: 999999, average_contract_value: 1000 });
  assert.match(c.text, /### \*\*TAM = \$1\.00B\*\*/);
});

// lookalike_signal_generator
test("lookalike_signal_generator: no invented ad category (B15-L4), triggers each mapped, stages respected", async () => {
  const r = await call("lookalike_signal_generator", { company: SPENDRILL, product_category: "spend management software",
    icp_firmographics: { industries: ["Manufacturing", "IT services"], company_sizes: ["201-500", "501-1000", "1001-5000"], locations: ["India"], funding_stages: ["Series B", "Series C"] },
    icp_technographics: ["SAP", "Tally", "Oracle NetSuite"], champion_titles: ["Finance Controller", "Head of Accounts Payable"],
    buying_triggers: ["new CFO hire", "audit finding", "ERP migration"] });
  common(r, SPENDRILL);
  assert.doesNotMatch(r.text, /Software > /);
  assert.doesNotMatch(r.text, /alternative"/);
  assert.doesNotMatch(r.text, /manufacturing software"/);
  assert.doesNotMatch(r.text, /Series A-C/);
  assert.match(r.text, /Series B, Series C/);
  for (const t of ["New CFO hire", "Audit finding", "ERP migration"]) assert.match(r.text, new RegExp(`### Trigger: ${t}`));
  assert.match(r.text, /"spend management software"/);
  assert.match(r.text, /reconciliation|month-end close|accounts payable/i);
});

test("lookalike_signal_generator: minimal input never prints 'Software > Software'; platforms selects the sections", async () => {
  const m = await call("lookalike_signal_generator", { company: "Cloudmoat", champion_titles: ["Cloud Security Lead"] });
  common(m, "Cloudmoat");
  assert.doesNotMatch(m.text, /Software > Software/);
  const p = await call("lookalike_signal_generator", { company: "Cloudmoat", champion_titles: ["Cloud Security Lead"], platforms: ["linkedin"] });
  assert.match(p.text, /## LinkedIn Sales Navigator/);
  assert.doesNotMatch(p.text, /## Google Ads Targeting/);
});

// account_prioritization
test("account_prioritization: reasons give the points, timing points shown, scores unchanged", async () => {
  const r = await call("account_prioritization", { company: SPENDRILL, accounts: [
    { name: "Example Manufacturing Co", fit_score: 80, intent_signals: 60, relationship: 40, timing: "soon" },
    { name: "Example IT Services Co", fit_score: 55, intent_signals: 90, relationship: 70, timing: "now" }] });
  common(r, SPENDRILL);
  assert.match(r.text, /\| \*\*Example IT Services Co\*\* \| 55 \| 90 \| 70 \| now \(100 pts\) \| \*\*75\*\* \| B \|/);
  assert.match(r.text, /\| \*\*Example Manufacturing Co\*\* \| 80 \| 60 \| 40 \| soon \(70 pts\) \| \*\*67\*\* \| B \|/);
  assert.doesNotMatch(r.text, /Balanced scoring/);
  assert.match(r.text, /intent 90 × 30% = 27 points/);
  const f = await call("account_prioritization", { company: SPENDRILL });
  assert.doesNotMatch(f.text, /Acme|Beta Inc/);
});

// icp_gap_analysis
test("icp_gap_analysis: compares the two profiles, pricing advice fits the model, gaps unchanged", async () => {
  const args = { company: SPENDRILL, product_category: "spend management software", current_customers: "Small companies under 200 employees, founder-run finance",
    ideal_icp: "Mid-size companies with a finance controller and an ERP",
    current_metrics: { avg_acv: 6000, avg_sales_cycle: 30, win_rate: 25, churn_rate: 18, nps: 28 },
    target_metrics: { avg_acv: 24000, avg_sales_cycle: 60, win_rate: 30, churn_rate: 8, nps: 45 } };
  const r = await call("icp_gap_analysis", args);
  common(r, SPENDRILL);
  assert.match(r.text, /\| \*\*Avg ACV\*\* \| \$6,000 \| \$24,000 \| \+300% needed \|/);
  assert.match(r.text, /In your ideal profile, not in your current base\*\*: [^\n]*finance controller/i);
  assert.match(r.text, /reconciliation|month-end close|audit trail/i);
  const s = await call("icp_gap_analysis", { ...args, company: "Example IT Services Co", product_category: "managed service desk", business_model: "services",
    current_customers: "Small IT teams buying a few hours of support", ideal_icp: "Mid-size companies outsourcing their service desk" });
  common(s, "Example IT Services Co");
  assert.doesNotMatch(s.text, /pricing tiers for enterprise|enterprise features/);
  assert.doesNotMatch(s.text, SAAS_ONLY);
});

// icp_evolution_tracker
test("icp_evolution_tracker: states a candidate change for each win, loss and market change; no [Your marker", async () => {
  const r = await call("icp_evolution_tracker", { company: SPENDRILL, product_category: "spend management software", current_icp: "Mid-size manufacturers with field sales teams",
    recent_wins: "IT services firms with heavy travel spend", recent_losses: "Large enterprises wanting an ERP-only expense module",
    time_period: "last quarter", market_changes: "More finance teams now ask for card spend and expense claims in one tool" });
  common(r, SPENDRILL);
  assert.doesNotMatch(r.text, /Check these wins for emerging ICP characteristics/);
  assert.match(r.text, /Candidate addition[^\n]*"IT services firms with heavy travel spend"/);
  assert.match(r.text, /Candidate disqualifier[^\n]*"Large enterprises wanting an ERP-only expense module"/);
  assert.match(r.text, /card spend and expense claims in one tool/);
  assert.match(r.text, /reconciliation|month-end close|audit trail/i);
});

// icp_interview_synthesizer
test("icp_interview_synthesizer: objections are not pains, questions quote the pain, plurals (B15-L5h), ties named", async () => {
  const r = await call("icp_interview_synthesizer", { company: SPENDRILL, interview_notes: [
    { customer: "Example Manufacturing Co", role: "Finance Controller", key_quotes: ["We spent the first week of every month matching card spends by hand."],
      pain_points: ["Slow month-end close", "our ERP already does this"], buying_triggers: ["New CFO hire"], value_realized: ["Close 5 days faster"] },
    { customer: "Example IT Services Co", role: "Head of Accounts Payable", key_quotes: ["Half my team's week went on chasing receipts."],
      pain_points: ["Late expense claims"], buying_triggers: ["Audit finding"], value_realized: ["Fewer policy breaches"] }] });
  common(r, SPENDRILL);
  assert.doesNotMatch(r.text, /handling our ERP|handling we /i);
  assert.match(r.text, /Objections heard[\s\S]*our ERP already does this/);
  assert.match(r.text, /We spent the first week of every month matching card spends by hand\./);
  assert.match(r.text, /no single leading role/i);
  const one = await call("icp_interview_synthesizer", { company: SPENDRILL, interview_notes: [{ customer: "Example Manufacturing Co", role: "Finance Controller", pain_points: ["Slow month-end close"] }] });
  assert.match(one.text, /\*\*Count\*\*: 1 interview\b/);
  assert.doesNotMatch(one.text, /1 interviews/);
});
