// Run 20 round 2 (quality, D92): tests for the causes the fresh judges found in round 1 (evidence/run20/round1/scores/raw-icp-*.jsonl).
// Companies are invented (Pathwise, Lanehop, Branchwire, Cloudmoat, Quantara); every figure is hypothetical.
// Run: node --test tests/run20-r2-quality.test.mjs
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
const BRACKET = /\[(?!\s*\]|x\])[A-Za-z][^\]\n]{2,}\]/;
const ok = (r) => { assert.equal(r.isError, false, r.text.slice(0, 300)); assert.doesNotMatch(r.text, BRACKET); assert.doesNotMatch(r.text, /undefined|NaN|\?\?/); };

// ---- (1) one splitter: numbers, abbreviations, elaborations ----
test("gap analysis: 500,000 and 1,000 are never split; 'in particular' and 'including' are not segments; the company's own segments are not disqualified", async () => {
  const r = await call("icp_gap_analysis", { product_category: "API platform for developers", company: "Pathwise",
    current_customers: "Pathwise customers: Financial services, Software and technology, Retail; POS and eCommerce. The metric figures sent are hypothetical.",
    ideal_icp: "API teams and developers at 500,000 companies, including 98% of the Fortune 500 (page claim), with platform leader as the buyer, who face disconnected tools and drifting specs" });
  ok(r);
  assert.doesNotMatch(r.text, /(?<!,)\b000 (?:and|companies)|500 and 000|\b500;|\*\*Segments\*\*: [^\n]*\b500\b/);
  assert.match(r.text, /500,000 companies/);
  assert.doesNotMatch(r.text, /Segments outside the ideal profile/);
  assert.match(r.text, /Retail; POS and eCommerce/);
});
test("gap analysis: 'in particular' is an elaboration of the size, 'more than 1,000' stays whole", async () => {
  const r = await call("icp_gap_analysis", { current_customers: "Branchwire customers: Banking and financial services, Manufacturing, Automotive. The metric figures sent are hypothetical.",
    ideal_icp: "enterprises, in particular multi location enterprises, with the page claiming more than 1,000 businesses as customers, with CIO as the buyer, who face legacy networks that fail" });
  ok(r);
  assert.doesNotMatch(r.text, /\*\*Segments\*\*: in particular|in particular \(from your ideal|more than 1 \(|\bmore than 1;/);
  assert.match(r.text, /multi[- ]location/i);
  assert.match(r.text, /more than 1,000 businesses/);
  assert.doesNotMatch(r.text, /Segments outside the ideal profile/);
});
test("gap analysis: FMCG/CPG is FMCG and CPG; GM-IT is one role; a profile with no shared segment is not compared for disqualifiers", async () => {
  const a = await call("icp_gap_analysis", { current_customers: "Lanehop customers: Retail, FMCG and CPG, 3PL.", ideal_icp: "Retail, FMCG/CPG and other industries" });
  ok(a);
  assert.match(a.text, /In both: Retail; FMCG and CPG/);
  assert.doesNotMatch(a.text, /Segments outside the ideal profile/);
  const b = await call("icp_gap_analysis", { current_customers: "Lanehop customers: FMCG and CPG, Cosmetics, Consumer durables.",
    ideal_icp: "national and international CPG and FMCG brands; sales and distribution teams, with GM-IT as the buyer, who face missed visits and manual work" });
  ok(b);
  assert.match(b.text, /\| \*\*Buyer or champion role\*\* \| not stated \| GM-IT \|/);
  assert.doesNotMatch(b.text, /GM-IT and GM|\bGM\b(?!-)/);
  assert.doesNotMatch(b.text, /Segments outside the ideal profile/);
  assert.match(b.text, /missed visits and manual work/);
});
test("gap analysis: the whole problem is kept, no invented 'first two calls', a page statement is not a qualifier", async () => {
  const r = await call("icp_gap_analysis", { product_category: "managed IT services", company: "Pathwise",
    current_customers: "Pathwise customers: Banks, Insurance.", ideal_icp: "Fortune 500 companies (the about page calls Pathwise a trusted partner of Fortune 500 companies), with CIO as the buyer, who face manual expense capture, a 60 day reimbursement cycle and cash leakage" });
  ok(r);
  assert.match(r.text, /manual expense capture, a 60 day reimbursement cycle and cash leakage/);
  assert.doesNotMatch(r.text, /first two calls/);
  assert.match(r.text, /Statements from a page, kept apart and not used as qualifiers/);
  assert.doesNotMatch(r.text, /\*\*Other qualifiers in your ideal profile\*\*[^\n]*trusted partner/);
});
test("evolution tracker: Sr. is not a role, GM-IT is one role, 500,000 and 'in particular' are not segments, FMCG/CPG is not a second segment", async () => {
  const r = await call("icp_evolution_tracker", { company: "Lanehop", product_category: "sales force automation software for FMCG route to market",
    current_icp: "Lanehop: national CPG and FMCG brands; API teams and developers at 500,000 companies, including 98% of the Fortune 500 (page claim); sales and distribution teams; segments: FMCG and CPG, Cosmetics, Gaming; streaming and entertainment; buyer: GM-IT; champion: Sr. Sales Automation Manager" });
  ok(r);
  assert.match(r.text, /\*\*Role Sr\. Sales Automation Manager\*\*/);
  assert.match(r.text, /\*\*Role GM-IT\*\*/);
  assert.doesNotMatch(r.text, /\*\*Role (?:Sr|GM)\*\*|\*\*Segment (?:500|000|in particular|more than 1)/);
  assert.match(r.text, /\*\*Segment Gaming; streaming and entertainment\*\*/);
  assert.equal((r.text.match(/\*\*Segment FMCG/g) || []).length, 1);
});
test("scoring model: 'Sr.' does not cut a statement in two; a value is 'named in' a statement only by whole words and phrases", async () => {
  const r = await call("icp_scoring_model", { product_category: "AI platform and investment strategies", company: "Quantara",
    success_correlation: "Nivea Sr. Sales Automation Manager: grew our top line by 6% (customer quote); $8B+ deployed across indexes and custom portfolios since 2015 (page claim); Sula CFO said the financial data of 500+ employees was secured (customer quote)",
    scoring_criteria: [{ criterion: "Buyer or champion role", importance: "important", values: ["portfolio manager", "CIO"] },
      { criterion: "Segment", importance: "critical", values: ["Financial services", "Gaming, streaming and entertainment"] }] });
  ok(r);
  assert.match(r.text, /- "Nivea Sr\. Sales Automation Manager: grew our top line by 6% \(customer quote\)": a customer statement/);
  assert.doesNotMatch(r.text, /"Nivea Sr"/);
  assert.doesNotMatch(r.text, /"portfolio manager": named in/);
  assert.doesNotMatch(r.text, /"Financial services": named in/);
  assert.match(r.text, /Not found in your evidence\*\*: [^\n]*"portfolio manager"/);
});

// ---- (3) buyer group ----
test("buyer group: no '(add the title to known_stakeholders)', and the review question is built from the objection as a quoted phrase", async () => {
  for (const product_category of ["billing and subscription revenue platform", "managed SD-WAN for branch offices", "AI platform and investment strategies"]) {
    const r = await call("buyer_group_analyzer", { product_category, typical_champion: "Head of Product", known_stakeholders: ["CFO"] });
    ok(r);
    assert.doesNotMatch(r.text, /add the title to known_stakeholders/);
    assert.doesNotMatch(r.text, /How have you handled/);
  }
  const t = await call("buyer_group_analyzer", { product_category: "managed SD-WAN for branch offices", known_stakeholders: ["CIO"] });
  assert.match(t.text, /"Has '[^']+' come up on similar purchases, and how was it settled\?"/);
});
test("buyer group: a billing platform sold to a CFO gets finance measures, not activation or time to value; an objection about price goes to the budget owner", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "recurring billing and revenue infrastructure", company: "Pathwise", typical_champion: "Head of Product", known_stakeholders: ["CFO", "Finance", "Engineering"] });
  ok(r);
  assert.doesNotMatch(r.text, /activation|time to value/i);
  assert.match(r.text, /days to close the books|reconciliation effort/);
  const t = await call("buyer_group_analyzer", { product_category: "developer testing tools", company: "Cloudmoat", typical_champion: "Platform Engineer", known_stakeholders: ["VP Engineering", "Security Lead", "Software Developer"] });
  assert.match(t.text, /### Potential Blocker[^\n]*\n\*\*Role\*\*: Security Lead\n\*\*Their Concern\*\*: Likely objection: security review/);
  assert.match(t.text, /### Economic Buyer[^\n]*\n\*\*Role\*\*: VP Engineering\n[^\n]*per-user cost/i);
});

// ---- (4) deep dive ----
test("deep dive: the hypothetical label is never cut from the description and the ACV carries it", async () => {
  const long = "Pathwise sells a platform for enterprises: " + "expense capture, approvals and reimbursements, ".repeat(14) + "to midsize to large businesses. The ACV and sales cycle figures in the customer records are hypothetical test figures.";
  const rec = (industry) => ({ name: industry, industry, acv: 30000, sales_cycle_days: 90, champion_title: "CFO" });
  const r = await call("icp_deep_dive", { customers: [rec("Banks"), rec("Retail")], customer_descriptions: long, product_category: "spend management software", company: "Pathwise" });
  ok(r);
  assert.match(r.text, /hypothetical test figures/);
  assert.match(r.text, /Average ACV \| \$30,000 \(hypothetical, as your description says\)/);
  assert.match(r.text, /In fintech, deals usually run like this:/);
});
test("deep dive: a billing platform sold to a CFO is not shown product-led SaaS measures; Finance Controller is not the CFO", async () => {
  const rec = { name: "Gaming", industry: "Gaming", acv: 60000, sales_cycle_days: 75, champion_title: "Head of Product" };
  const r = await call("icp_deep_dive", { customers: [rec, { ...rec, name: "Media", industry: "Media", champion_title: "CFO" }], product_category: "recurring billing and revenue infrastructure", company: "Pathwise" });
  ok(r);
  assert.doesNotMatch(r.text, /activation rate|time to value/);
  assert.match(r.text, /Champion CFO\*\*: matches a role that finance buyers deals usually involve|Champion CFO\*\*: matches a role that finance buyers/);
});

// ---- (5) lookalike ----
test("lookalike: the company name stripped from the product leaves no empty brackets; a, an; Developer Advocate is a title; no 'managed service services'", async () => {
  const q = await call("lookalike_signal_generator", { company: "Quantara", product_category: "AI platform and investment strategies (Quantara Edge from Quantara)", champion_titles: ["Portfolio Manager", "CIO"],
    icp_firmographics: { industries: ["Asset allocators (pensions; insurers)", "Investment banks"] } });
  ok(q);
  assert.doesNotMatch(q.text, /from \)|\(\s*\)/);
  assert.match(q.text, /"AI platform and investment strategies"/);
  assert.doesNotMatch(q.text, /Head of Customer Experience|a AI native/);
  const s = await call("lookalike_signal_generator", { company: "Pathwise", product_category: "managed service desk and IT services (Pathwise managed services from Pathwise)", champion_titles: ["Developer Advocate", "CIO"],
    icp_firmographics: { industries: ["Telecom, media and technology", "Banks"] } });
  ok(s);
  assert.doesNotMatch(s.text, /managed service services|from \)/);
  assert.match(s.text, /Current job title: "Developer Advocate" OR "CIO"/);
  assert.match(s.text, /\*\*Industries\*\*: Telecom, media and technology; Banks/);
});
test("lookalike: no 'keywords after the first one' sentence when there are none; a billing buyer is not given SaaS measures as search words", async () => {
  const r = await call("lookalike_signal_generator", { company: "Pathwise", product_category: "recurring billing and revenue infrastructure", champion_titles: ["CFO"] });
  ok(r);
  assert.doesNotMatch(r.text, /The keywords after the first one/);
  assert.doesNotMatch(r.text, /activation|time to value|net revenue retention/);
});

// ---- (7) interview ----
test("interview: a partner quote is a quote, not the outcome buyers seek; the source in front of a quote becomes its attribution; the question is not built from the product", async () => {
  const r = await call("icp_interview_synthesizer", { product_category: "IT services from Pathwise", company: "Pathwise", interview_notes: [{ customer: "Banks", role: "CIO",
    pain_points: ["slow modernization of legacy systems"],
    value_realized: ["Microsoft's CVP thanks Pathwise as a global partner (partner quote)", "Sula Vineyards CFO on the home page: the tool cut a 60 day cycle to 10 days (customer quote)", "Won a 20 million dollar deal (case study title)"] }] });
  ok(r);
  assert.doesNotMatch(r.text, /Seeks outcome: Microsoft/);
  assert.match(r.text, /> "the tool cut a 60 day cycle to 10 days"\s*\n> \(Customer at Sula Vineyards CFO|> \(Customer at Sula Vineyards CFO|Sula Vineyards CFO/);
  assert.match(r.text, /Microsoft's CVP thanks Pathwise/);
  assert.match(r.text, /biggest challenge you face in this area today\?"[^\n]*slow modernization of legacy systems/);
  assert.doesNotMatch(r.text, /challenge you face with IT services/);
  assert.doesNotMatch(r.text, / \.\.\.\?/);
});
test("interview: a billing product sold to a CFO is not given SaaS measures", async () => {
  const r = await call("icp_interview_synthesizer", { product_category: "recurring billing and revenue infrastructure", company: "Pathwise", interview_notes: [{ customer: "Media", role: "CFO", pain_points: ["billing leakage"] }] });
  ok(r);
  assert.doesNotMatch(r.text, /activation rate|time to value|onboarding/);
  assert.match(r.text, /days to close the books|reconciliation effort|month-end/);
});

// ---- (8) account prioritization ----
test("account prioritization: the 'Gap to address' agrees with the weakest factor in the next step", async () => {
  const r = await call("account_prioritization", { accounts: [{ name: "A", fit_score: 85, intent_signals: 40, relationship: 60, timing: "now" }, { name: "B", fit_score: 70, intent_signals: 75, relationship: 30, timing: "soon" }, { name: "C", fit_score: 60, intent_signals: 20, relationship: 10, timing: "later" }] });
  ok(r);
  const blocks = r.text.split("### ").slice(-3);
  assert.match(blocks[0], /Generate engagement/);
  assert.match(blocks[1], /Build relationships/);
  assert.match(blocks[2], /Build relationships/);
  assert.match(blocks[2], /weakest factor is relationship \(10\)/);
});

// ---- the sector file of round 2: an investment seller (QuantumStreet AI style) ----
test("an investment strategies seller gets investment roles and measures in every tool, never support automation", async () => {
  const product_category = "AI platform and investment strategies (Quantara Edge from Quantara AI)";
  const company = "Quantara AI";
  const rec = (industry) => ({ name: industry, industry, acv: 250000, sales_cycle_days: 180, champion_title: "Portfolio Manager" });
  const SUPPORT = /resolution rate|Head of Customer Experience|escalation rate|evaluation set|contact cent|help desk|handling time/i;
  const runs = [
    ["icp_deep_dive", { customers: [rec("Asset allocators"), rec("Investment banks")], product_category, company }],
    ["icp_scoring_model", { product_category, company, scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Asset allocators", "Wealth managers"] }] }],
    ["buyer_group_analyzer", { product_category, company, typical_champion: "Portfolio Manager", known_stakeholders: ["CIO", "risk teams"] }],
    ["lookalike_signal_generator", { product_category, company, champion_titles: ["Portfolio Manager", "Chief Investment Officer"], icp_firmographics: { industries: ["Asset allocators"] } }],
    ["icp_gap_analysis", { product_category, company, current_customers: "Quantara customers: Asset allocators, Wealth managers.", ideal_icp: "asset allocators and banks, with CIO as the buyer" }],
    ["icp_evolution_tracker", { product_category, company, current_icp: "Quantara AI: asset allocators; segments: Asset allocators, Wealth managers; buyer: CIO; champion: Portfolio Manager" }],
    ["icp_interview_synthesizer", { product_category, company, interview_notes: [{ customer: "Allocators", role: "CIO", pain_points: ["static factor exposures in quant strategies"] }] }],
  ];
  for (const [tool, args] of runs) {
    const r = await call(tool, args);
    ok(r);
    assert.doesNotMatch(r.text, SUPPORT, tool);
    assert.match(r.text, /investment management/, tool);
  }
  const b = await call("buyer_group_analyzer", { product_category, company, known_stakeholders: ["CIO"] });
  assert.match(b.text, /### Champion[^\n]*\n\*\*Role\*\*: Head of Manager Research/);
  assert.match(b.text, /A black box cannot be explained to our committee|track record is too short/i);
});
test("a support automation seller still gets the support notes (the neutral AI native entry is for the other sellers)", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "AI agents that resolve customer support tickets", company: "Pathwise" });
  ok(r);
  assert.match(r.text, /resolution|handling time|ticket/i);
});
