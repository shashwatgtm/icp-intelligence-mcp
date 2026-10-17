// Run 20 round 1b (quality, owner decision D92): tests written for the causes the fresh judges found in set T.
// Companies are invented (Spendrill, Lanehop, Branchwire, Cloudmoat, Pathwise); every figure is hypothetical.
// Run: node --test tests/run20-r1b-quality.test.mjs
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
const B75 = /\b(clinics?|patients?|hospitals?|healthcare|hipaa|ehr|appointments?|no-shows?|dental|physio\w*)\b/i;
// A bracket placeholder: a bracket with words in it (not a check box "[ ]" or "[x]")
const BRACKET = /\[(?!\s*\]|x\])[A-Za-z][^\]\n]{2,}\]/;
const GARBLE = /\?\?|undefined|NaN|\bnull\b/;
const clean = (r, what = "") => {
  assert.equal(r.isError, false, r.text.slice(0, 300));
  assert.doesNotMatch(r.text, B75, `${what}: a B75 word`);
  assert.doesNotMatch(r.text, BRACKET, `${what}: a bracket placeholder: ${(r.text.match(BRACKET) || [""])[0]}`);
  assert.doesNotMatch(r.text, GARBLE, `${what}: garbled text`);
};

// ---- the one shared reader ----
test("the repo has one sector reader: src/verticals.ts (byte copy of the shared one) and no own sellerSector rule", () => {
  const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /function sellerSector/);
  assert.match(src, /explainSector/);
  const v = readFileSync(new URL("../src/verticals.ts", import.meta.url), "utf8");
  assert.match(v, /export function explainSector/);
});

test("the seller's words decide the sector; the buyer's industry does not outrank them", async () => {
  const r = await call("icp_scoring_model", { product_category: "spend management software", company: "Spendrill",
    scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Telecommunications operators", "Retail chains"] }] });
  clean(r, "scoring");
  assert.match(r.text, /Sector: read from your inputs as fintech/);
});

test("a sector read from the buyer's industry or job titles alone is not applied (no sector notes for the wrong business)", async () => {
  const r = await call("lookalike_signal_generator", { champion_titles: ["Director of Transportation Data Operations"], icp_firmographics: { industries: ["Banking and financial services"] } });
  clean(r, "lookalike");
  assert.match(r.text, /Sector: not clear from what you sell/);
  assert.doesNotMatch(r.text, /### Sector notes/);
});

// ---- no-shows and bracket placeholders, every tool ----
test("B75: no tool prints no-shows or a bracket placeholder, with or without a sector", async () => {
  const runs = [
    ["buyer_group_analyzer", { product_category: "something unclear" }],
    ["buyer_group_analyzer", { product_category: "managed SD-WAN for companies with many branches" }],
    ["buyer_group_analyzer", { product_category: "spend management software", known_stakeholders: ["CFO", "finance teams"] }],
    ["icp_scoring_model", {}],
    ["icp_scoring_model", { scoring_criteria: [{ criterion: "Budget", importance: "critical", values: [] }] }],
    ["icp_interview_synthesizer", { interview_notes: [{ customer: "Lanehop", role: "COO", pain_points: ["late deliveries"] }] }],
    ["icp_interview_synthesizer", { raw_transcripts: "We talked to three customers." }],
    ["icp_deep_dive", {}], ["icp_gap_analysis", { current_customers: "mid-size banks", ideal_icp: "large banks" }],
    ["icp_evolution_tracker", { current_icp: "mid-size banks" }], ["account_prioritization", {}],
    ["lookalike_signal_generator", { champion_titles: ["CFO"] }],
    ["tam_sam_som_calculator", { total_potential_companies: 1000, average_contract_value: 10000 }],
  ];
  for (const [tool, args] of runs) clean(await call(tool, args), tool);
});

// ---- icp_deep_dive ----
const sameRecord = (industry) => ({ name: `${industry} (customers of Spendrill)`, industry, acv: 30000, sales_cycle_days: 90,
  buying_trigger: "manual expense capture and a long reimbursement cycle, with old systems", champion_title: "CFO" });
test("icp_deep_dive: identical records are named as repeated data, and all four industries are shown (shares add up to 100%)", async () => {
  const r = await call("icp_deep_dive", { customers: ["Fintech", "Insurance", "Telecommunications", "Retail"].map(sameRecord), product_category: "spend management software",
    customer_descriptions: "Spendrill sells expense software to midsize to large businesses and global conglomerates. The ACV figures are hypothetical." });
  clean(r, "deep dive");
  assert.match(r.text, /Read this first\*\*: in all 4 records the ACV, sales cycle, buying trigger and champion are identical/);
  for (const i of ["Fintech", "Insurance", "Telecommunications", "Retail"]) assert.match(r.text, new RegExp(`\\*\\*${i}\\*\\*: 1 customer \\(25%\\)`));
  assert.match(r.text, /The same value is in every record, so this is repeated data/);
  assert.match(r.text, /the same ACV and cycle, so the industries cannot yet be ranked/);
  assert.match(r.text, /\*\*Industry\*\*: Fintech, Insurance, Telecommunications and Retail \(tied: 4 industries equally common\)/);
  assert.match(r.text, /\$30,000 \(the same in every record\)/);
});
test("icp_deep_dive: the description is used (size words as typed, nothing invented) and the champion is checked against the sector's roles", async () => {
  const r = await call("icp_deep_dive", { customers: [sameRecord("Fintech"), { ...sameRecord("Insurance"), acv: 40000, champion_title: "Head of Treasury" }], product_category: "spend management software",
    customer_descriptions: "Spendrill sells expense software to midsize to large businesses." });
  clean(r, "deep dive");
  assert.match(r.text, /your description says midsize and large|midsize, large/);
  assert.match(r.text, /Champion CFO\*\*: matches a role that fintech, spend and expense deals usually involve \(Chief Financial Officer\)/);
  assert.match(r.text, /Champion Head of Treasury\*\*: matches a role that fintech, spend and expense deals usually involve \(Head of Treasury\)/);
  assert.match(r.text, /Roles your records do not name/);
  assert.doesNotMatch(r.text, /1000\+|100-1000/); // no invented size ranges
});

// ---- buyer_group_analyzer ----
test("buyer_group_analyzer: every sector fills the group from the sector's roles; stakeholders typed are placed; no placeholder", async () => {
  const cases = [
    ["managed SD-WAN and business internet for companies with many branches", /Role\*\*: Chief Information Officer/, /site survey|pilot sites/i],
    ["fleet routing and dispatch software", /Role\*\*: Chief Operating Officer/, /dispatch|delivery/i],
    ["cloud security monitoring", /Role\*\*: CISO/, /exposure|alert/i],
    ["sales force automation for FMCG distributors", /Role\*\*: National Sales Head/, /secondary sales|outlet/i],
    ["IT services and managed service desk", /Role\*\*: Chief Information Officer/, /SLA|transition/i],
  ];
  for (const [product_category, role, word] of cases) {
    const r = await call("buyer_group_analyzer", { product_category, company: "Pathwise" });
    clean(r, product_category);
    assert.match(r.text, role, product_category);
    assert.match(r.text, word, product_category);
    assert.match(r.text, /Likely objection:/);
    assert.doesNotMatch(r.text, /Department Head|C-Level Sponsor/);
  }
});
test("buyer_group_analyzer: the champion and stakeholders typed are used, the sector's usual roles you did not name are listed", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "spend management software", company: "Spendrill", typical_champion: "Finance Controller",
    known_stakeholders: ["CFO", "finance teams", "HR", "Head of IT", "Internal Audit Lead"], deal_size: "$30,000 (hypothetical)" });
  clean(r, "buyer group");
  assert.match(r.text, /### Champion[^\n]*\n\*\*Role\*\*: Finance Controller\n/);
  assert.match(r.text, /### Economic Buyer[^\n]*\n\*\*Role\*\*: CFO\n/);
  assert.match(r.text, /### Technical Evaluator[^\n]*\n\*\*Role\*\*: Head of IT\n/);
  assert.match(r.text, /### Potential Blocker[^\n]*\n\*\*Role\*\*: Internal Audit Lead\n/);
  assert.match(r.text, /### End User[^\n]*\n\*\*Role\*\*: finance teams\n/);
  assert.match(r.text, /Also in the group \(your input\)\*\*: HR \(user\)/);
  assert.doesNotMatch(r.text, /sandbox\/POC access[\s\S]*Salesforce sync/);
});
test("buyer_group_analyzer: a champion you did not name is shown as the sector's usual one, and says so", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "managed SD-WAN for branch offices", known_stakeholders: ["CIO"] });
  clean(r, "buyer group");
  assert.match(r.text, /Role\*\*: Head of IT Infrastructure \(the usual one in telecom, operators and enterprise connectivity; you named none\)/);
  assert.match(r.text, /You did not name a champion/);
});
test("buyer_group_analyzer: an unclear product says what input would fill each seat, with no bracket", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "our thing" });
  clean(r, "buyer group");
  assert.match(r.text, /add typical_champion/);
  assert.match(r.text, /not named in your stakeholders \(ask your champion who holds the budget\)/);
  assert.doesNotMatch(r.text, /Only if true and provable|Fill in:/);
});

// ---- icp_scoring_model ----
test("icp_scoring_model: the tier actions follow the business model (no 24 hour demo for services or connectivity)", async () => {
  const sv = await call("icp_scoring_model", { product_category: "IT services and managed service desk", company: "Pathwise", scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Banks", "Telecom operators"] }] });
  clean(sv, "scoring services");
  assert.doesNotMatch(sv.text, /Demo within 24 hours/);
  assert.match(sv.text, /Scoping call within 3 working days/);
  const cn = await call("icp_scoring_model", { product_category: "managed SD-WAN for branch offices", scoring_criteria: [{ criterion: "Branches", importance: "critical", values: ["200 or more", "50 to 199"] }] });
  assert.match(cn.text, /Site survey booked within a week/);
  const sa = await call("icp_scoring_model", { product_category: "spend management software", scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Banks", "Retail"] }] });
  assert.match(sa.text, /First meeting within 2 working days/);   // round 2: a read SaaS model no longer gets the 24 hour demo; the framework default (no model read) keeps it
  assert.match(sa.text, /☐/);
  assert.doesNotMatch(sa.text.split("## Qualification Scorecard Template")[1].split("## Implementation Guide")[0], /\[ \]/); // the scorecard uses a check box sign
});
test("icp_scoring_model: a long value is shown whole once; the proof is sorted and linked to the values it mentions", async () => {
  const long = "legacy WAN is like a single congested highway prone to jams, slowdowns and disconnections, with enterprises juggling multiple providers and slow cloud access at remote offices and branches";
  const r = await call("icp_scoring_model", { product_category: "managed SD-WAN for branch offices", company: "Branchwire",
    success_correlation: "A leading bank achieved 99.5% uptime across 2000 branches (page claim); Panasonic consolidated its network under one partner (customer quote)",
    scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Banks", "Manufacturing"] }, { criterion: "Problem", importance: "important", values: [long] }] });
  clean(r, "scoring");
  assert.match(r.text, /\(full wording below\)/);
  assert.equal(r.text.split(long).length - 1, 1, "the long value is printed in full once");
  assert.match(r.text, /a page claim or recognition, not a closed-deal result/);
  assert.match(r.text, /a customer statement/);
  assert.match(r.text, /Segment, "Banks": named in "A leading bank achieved 99\.5% uptime across 2000 branches \(page claim\)"/);
  // run 22: the points are explained for the kind of list given; named targets score the full weight each
  assert.match(r.text, /you listed the customers or roles you want, so every value you listed scores the full weight/);
  assert.match(r.text, /Banks \(25 pts\) \/ Manufacturing \(25 pts\) \/ Anything not listed above \(0 pts\)/);
});

// ---- tam_sam_som_calculator ----
test("tam_sam_som_calculator: $4,050,000 prints $4.1M (round half up), the unit of ACV follows the business model, no wrong sector from the segment", async () => {
  const r = await call("tam_sam_som_calculator", { company: "Pathwise", total_potential_companies: 4500, average_contract_value: 30000, icp_percentage: 30, year1_market_share_target: 10, segment_name: "Banking and financial services" });
  clean(r, "tam");
  assert.match(r.text, /### \*\*SOM = \$4\.1M\*\*/);
  assert.doesNotMatch(r.text, /### Sector notes: fintech/);
  assert.match(r.text, /Sector notes: none/);
  const s = await call("tam_sam_som_calculator", { company: "Pathwise managed services", total_potential_companies: 500, average_contract_value: 400000, data_sources: "hypothetical, managed service desk contracts" });
  assert.match(s.text, /read as annual value per client|annual contract value/);
});

// ---- lookalike_signal_generator ----
test("lookalike_signal_generator: no US startup defaults; what is missing is named; groups of people are not searched as job titles", async () => {
  const r = await call("lookalike_signal_generator", { champion_titles: ["CFO", "finance teams", "managers", "employees", "HR", "Head of Treasury"],
    icp_firmographics: { industries: ["Banks", "Insurance"] }, product_category: "spend management software", company: "Spendrill" });
  clean(r, "lookalike");
  assert.doesNotMatch(r.text, /Salesforce|HubSpot|United States|51-200|201-500|Series A|New leadership hire|Funding round/);
  assert.match(r.text, /Current job title: "CFO" OR "Head of Treasury"/);
  assert.match(r.text, /Not job titles, so not in the title search: finance teams, managers, employees, HR/);
  assert.match(r.text, /Company Sizes\*\*: not supplied \(add icp_firmographics\.company_sizes/);
  assert.match(r.text, /Not supplied, so left out of the searches: company_sizes, locations, icp_technographics, buying_triggers/);
  assert.match(r.text, /No buying triggers were given/);
});
test("lookalike_signal_generator: search words fit how the seller sells (a connectivity provider is not searched as software)", async () => {
  const r = await call("lookalike_signal_generator", { champion_titles: ["Head of IT Infrastructure"], product_category: "managed SD-WAN for branch offices", company: "Branchwire",
    buying_triggers: ["Contract with the current operator ends in the next year", "New branches opened"], icp_firmographics: { company_sizes: ["500-2000 employees"], locations: ["India"] } });
  clean(r, "lookalike");
  assert.match(r.text, /"SD[- ]WAN provider"/);   // run 21: the shared file writes the sector word without a dash
  assert.doesNotMatch(r.text, /SD-WAN software|MPLS software/);
  assert.match(r.text, /### Trigger: Contract with the current operator ends in the next year/);
  assert.match(r.text, /Company headcount: 500-2000 employees/);
});

// ---- account_prioritization ----
test("account_prioritization: two accounts in one tier get different next steps from their own scores; no SDR sequence or 24 hour reply", async () => {
  const r = await call("account_prioritization", { accounts: [
    { name: "Lanehop Retail", fit_score: 85, intent_signals: 40, relationship: 60, timing: "now" },
    { name: "Branchwire Banks", fit_score: 70, intent_signals: 75, relationship: 30, timing: "soon" },
    { name: "Pathwise Energy", fit_score: 60, intent_signals: 20, relationship: 10, timing: "later" }] });
  clean(r, "accounts");
  assert.doesNotMatch(r.text, /SDR sequence|within 24 hours/);
  const actions = [...r.text.matchAll(/\*\*Recommended action\*\*: ([^\n]+)/g)].map((m) => m[1]);
  assert.equal(actions.length, 3);
  assert.equal(new Set(actions).size, 3, "every account has its own next step");
  assert.match(actions[1], /relationship is 30/);
  assert.match(r.text, /Lanehop Retail[\s\S]*Why prioritized/);
});

// ---- icp_gap_analysis ----
test("icp_gap_analysis: the current base and the ideal profile are compared part by part; no preset metrics are invented", async () => {
  const r = await call("icp_gap_analysis", { company: "Spendrill", product_category: "spend management software",
    current_customers: "Spendrill customers: Fintech, Insurance, Retail. Small companies under 200 employees.",
    ideal_icp: "Mid-size banks, Insurance, with CFO as the buyer, who face manual reconciliation and late month-end close",
    current_metrics: { avg_acv: 30000, avg_sales_cycle: 90 } });
  clean(r, "gap");
  // run 22 rewrite: the same parts are compared in sentences, each against the whole other text
  assert.match(r.text, /\*\*Named in both\*\*: Insurance/);
  assert.match(r.text, /\*\*Named in your ideal profile but not in your current base\*\*: Mid-size banks/);
  assert.match(r.text, /Your ideal profile names CFO as the buyer, and your current base does not say who bought/);
  assert.match(r.text, /manual reconciliation and late month-end close/);
  assert.match(r.text, /In your current base but not named in your ideal profile\*\*: Fintech and Retail/);
  // no invented numbers
  assert.doesNotMatch(r.text, /20%|\$40,000|\$50,000|Example figure/);
  assert.match(r.text, /\| \*\*Avg ACV\*\* \| \$30,000 \| not supplied \| needs both a current and a target value \| Not rated \|/);
  assert.doesNotMatch(r.text, /## Gap Root Cause Analysis|## Causes to check/);
});
test("icp_gap_analysis: a metric with both values keeps its gap exactly as before; one with a missing side is not compared", async () => {
  const r = await call("icp_gap_analysis", { current_customers: "mid-size banks", ideal_icp: "large banks",
    current_metrics: { avg_acv: 24000, avg_sales_cycle: 90, win_rate: 20 }, target_metrics: { avg_acv: 36000, avg_sales_cycle: 60 } });
  clean(r, "gap");
  assert.match(r.text, /\| \*\*Avg ACV\*\* \| \$24,000 \| \$36,000 \| \+50% needed \| Medium \|/);
  assert.match(r.text, /\| \*\*Sales Cycle\*\* \| 90 days \| 60 days \| -33% needed \| High \|/);
  assert.match(r.text, /\| \*\*Win Rate\*\* \| 20% \| not supplied \| needs both a current and a target value \| Not rated \|/);
  assert.match(r.text, /### Avg ACV \(\+50% needed\)/);
  assert.doesNotMatch(r.text, /### Win Rate/);
});

// ---- icp_evolution_tracker ----
test("icp_evolution_tracker: with no wins or losses, the current ICP is read part by part and each part gets a test", async () => {
  const r = await call("icp_evolution_tracker", { product_category: "managed SD-WAN for branch offices", company: "Branchwire",
    current_icp: "Branchwire: multi-location enterprises; segments: Banking, Manufacturing, Automotive; buyer: CIO" });
  clean(r, "evolution");
  assert.match(r.text, /## Your Current ICP, Part by Part/);
  assert.match(r.text, /\*\*Segment Banking\*\*: list every deal you won or lost with Banking in it/);
  assert.match(r.text, /\*\*Segment Automotive\*\*/);
  assert.match(r.text, /\*\*Role CIO\*\*: do deals that involve CIO close faster or larger/);
  assert.match(r.text, /Roles usual in telecom, operators and enterprise connectivity that your ICP does not name/);
  assert.match(r.text, /Loss reasons to tag in your CRM/);
  assert.match(r.text, /Compare win rate, ACV and cycle across Banking, Manufacturing and Automotive/);
});

// ---- icp_interview_synthesizer ----
const page = (i) => ({ customer: `Retail ${i} (customer of Lanehop)`, role: "Chief Operating Officer",
  pain_points: ["last mile is the costliest phase of the supply chain, often 50 to 53% of total shipping expenses (page claim), with fragmented routes and failed deliveries",
    "Does Lanehop integrate with our TMS?", "How is Lanehop different from a routing tool?"],
  value_realized: ["Pathwise cuts dispatch planning time by 66% (case study title)", "Customer quote: launched in 24 of our DCs in less than two months", "Named a Leader by an analyst for 7 consecutive years (home page)"] });
test("icp_interview_synthesizer: buyer questions, claims and quotes are sorted; repeated notes are named; no ?? and no 3x (100%)", async () => {
  const r = await call("icp_interview_synthesizer", { interview_notes: [page(1), page(2), page(3)], product_category: "last-mile delivery orchestration software" });
  clean(r, "interview");
  assert.match(r.text, /All 3 interview notes carry the same pain points, questions and value statements/);
  assert.doesNotMatch(r.text, /3x \(100%\)|mentioned \d+x/);
  assert.match(r.text, /### Questions Buyers Asked \(not counted as pain points\)/);
  assert.match(r.text, /"Does Lanehop integrate with our TMS\?" \(in all 3 interviews\): Answer with the named systems/);
  assert.match(r.text, /"How is Lanehop different from a routing tool\?"[^\n]*Prepare one honest line/);
  assert.match(r.text, /Claims and recognition in your notes/);
  assert.match(r.text, /Pathwise cuts dispatch planning time by 66% \(case study title\)/);
  // the quote-style statement is a Key Quote, labelled as such
  assert.match(r.text, /## Key Quotes\s+### Quote 1\s+> "launched in 24 of our DCs in less than two months"/);
  // discovery question built from a clause, not the whole pasted sentence
  assert.match(r.text, /1\. About "last mile is the costliest phase of the supply chain": how does your team handle this today/);
  assert.doesNotMatch(r.text, /How are you currently handling/);
  // the pain point is not cut at the decimal-free number "50 to 53%"
  assert.match(r.text, /often 50 to 53% of total shipping expenses/);
});
test("icp_interview_synthesizer: separate interviews are counted as k of n; quotes given are kept word for word; no quotes means a plain line", async () => {
  const mk = (i, role, pain, extra = {}) => ({ customer: `Branchwire ${i}`, role, pain_points: [pain], buying_triggers: ["Audit finding"], value_realized: ["Close 5 days faster"], ...extra });
  const r = await call("icp_interview_synthesizer", { product_category: "spend management software", interview_notes: [
    mk(1, "Finance Controller", "Slow month-end close", { key_quotes: ["We spent a week matching card spends"] }),
    mk(2, "Finance Controller", "Slow month-end close"), mk(3, "Head of Finance", "Late expense claims")] });
  clean(r, "interview");
  assert.match(r.text, /\*\*Slow month-end close\*\*: in 2 of 3 interviews \(67%\)/);
  assert.match(r.text, /> "We spent a week matching card spends"/);
  assert.doesNotMatch(r.text, /all 3 interview notes carry the same/);
  const none = await call("icp_interview_synthesizer", { interview_notes: [mk(1, "COO", "Late deliveries")] });
  assert.match(none.text, /No key_quotes were given and none of your statements is marked as a customer quote/);
  assert.match(none.text, /No triggers captured|Audit finding/);
});
test("icp_interview_synthesizer: with no product the template line names the top pain, not a bracket", async () => {
  const r = await call("icp_interview_synthesizer", { interview_notes: [{ customer: "Lanehop", role: "COO", pain_points: ["late deliveries, with angry customers"] }] });
  clean(r, "interview");
  assert.match(r.text, /biggest challenge you face in this area today\?"[^\n]*late deliveries, with angry customers/);
});

// ---- no SaaS-only words for a connectivity or services business, in any tool ----
const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
test("no SaaS-only term (seat, trial, MRR) in any tool answer for a connectivity or a services business", async () => {
  for (const product_category of ["managed SD-WAN and business internet for companies with many branches", "IT services and managed service desk"]) {
    const cust = [{ name: "Lanehop", industry: "Banks", acv: 90000, sales_cycle_days: 120, champion_title: "Head of IT Infrastructure", buying_trigger: "a contract that ends" }];
    const runs = [
      ["icp_deep_dive", { customers: cust, product_category }],
      ["icp_scoring_model", { product_category, scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Banks", "Retail"] }] }],
      ["buyer_group_analyzer", { product_category, known_stakeholders: ["CIO", "Head of Procurement"] }],
      ["buyer_group_analyzer", { product_category }],
      ["tam_sam_som_calculator", { total_potential_companies: 800, average_contract_value: 90000 }],
      ["lookalike_signal_generator", { champion_titles: ["Head of IT Infrastructure"], product_category }],
      ["account_prioritization", { accounts: [{ name: "Lanehop", fit_score: 80, intent_signals: 70, relationship: 50, timing: "now" }] }],
      ["icp_gap_analysis", { product_category, current_customers: "Banks", ideal_icp: "Large banks with 500 to 2,000 employees" }],
      ["icp_evolution_tracker", { product_category, current_icp: "Banks; buyer: CIO" }],
      ["icp_interview_synthesizer", { product_category, interview_notes: [{ customer: "Lanehop", role: "CIO", pain_points: ["slow repairs"] }] }],
    ];
    for (const [tool, args] of runs) {
      const r = await call(tool, args);
      clean(r, `${tool} / ${product_category}`);
      assert.doesNotMatch(r.text, SAAS_ONLY, `${tool} / ${product_category}`);
    }
  }
});
test("buyer_group_analyzer: a seat none of the stakeholders fills shows the sector's usual role and says so", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "managed SD-WAN for branch offices", typical_champion: "Network Manager", known_stakeholders: ["CIO"] });
  clean(r, "buyer group");
  assert.match(r.text, /### Technical Evaluator[^\n]*\n\*\*Role\*\*: CISO \(usual in telecom, operators and enterprise connectivity; none of your stakeholders fits this role\)/);
  assert.match(r.text, /### Economic Buyer[^\n]*\n\*\*Role\*\*: CIO\n/);
});
test("buyer_group_analyzer: AI native and SaaS products do not get the sector's usual roles or yardsticks for a function the user did not name", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "AI platform that forecasts portfolio risk for asset managers", typical_champion: "Portfolio Manager", known_stakeholders: ["CIO"] });
  clean(r, "buyer group");
  assert.doesNotMatch(r.text, /resolution rate|Head of Customer Experience/);
  assert.doesNotMatch(r.text, /add the title to known_stakeholders/);
});
