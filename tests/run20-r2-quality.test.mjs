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
  assert.match(r.text, /Retail, POS and eCommerce/);   // run 22: one segment, not split at its semicolon
  assert.match(r.text, /Statements from a page, kept apart[^\n]*Fortune 500/);
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
  assert.match(a.text, /Named in both\*\*: Retail, and FMCG and CPG/);
  assert.doesNotMatch(a.text, /Segments outside the ideal profile|not named in your ideal profile\*\*: 3PL/);   // the ideal profile is open ended ("and other industries")
  const b = await call("icp_gap_analysis", { current_customers: "Lanehop customers: FMCG and CPG, Cosmetics, Consumer durables.",
    ideal_icp: "national and international CPG and FMCG brands; sales and distribution teams, with GM-IT as the buyer, who face missed visits and manual work" });
  ok(b);
  assert.match(b.text, /Your ideal profile names GM-IT as the buyer/);
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
  assert.match(r.text, /No statement names these yet[^\n]*: [^\n]*"portfolio manager"/);
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
  assert.doesNotMatch(r.text, /card spends|policy breach|accounts payable|days to close the books/i);   // an expense profile is not a billing buyer's (the billing profile comes with the shared file)
  const t = await call("buyer_group_analyzer", { product_category: "developer testing tools", company: "Cloudmoat", typical_champion: "Platform Engineer", known_stakeholders: ["VP Engineering", "Security Lead", "Software Developer"] });
  assert.match(t.text, /### Potential Blocker[^\n]*\n\*\*Role\*\*: Security Lead\n\*\*Their Concern\*\*: Likely objection: security review/);
  assert.match(t.text, /### Economic Buyer[^\n]*\n\*\*Role\*\*: VP Engineering\n[^\n]*per[- ]user cost/i);
});

// ---- (4) deep dive ----
test("deep dive: the hypothetical label is never cut from the description and the ACV carries it", async () => {
  const long = "Pathwise sells a platform for enterprises: " + "expense capture, approvals and reimbursements, ".repeat(14) + "to midsize to large businesses. The ACV and sales cycle figures in the customer records are hypothetical test figures.";
  const rec = (industry) => ({ name: industry, industry, acv: 30000, sales_cycle_days: 90, champion_title: "CFO" });
  const r = await call("icp_deep_dive", { customers: [rec("Banks"), rec("Retail")], customer_descriptions: long, product_category: "spend management software", company: "Pathwise" });
  ok(r);
  assert.match(r.text, /hypothetical test figures/);
  assert.match(r.text, /Average ACV \| \$30,000 \(hypothetical, as your description says\)/);
  assert.match(r.text, /In fintech, spend and expense, deals usually run like this:/);
});
test("deep dive: a billing platform sold to a CFO is not shown product-led SaaS measures; Finance Controller is not the CFO", async () => {
  const rec = { name: "Gaming", industry: "Gaming", acv: 60000, sales_cycle_days: 75, champion_title: "Head of Product" };
  const r = await call("icp_deep_dive", { customers: [rec, { ...rec, name: "Media", industry: "Media", champion_title: "CFO" }], product_category: "recurring billing and revenue infrastructure", company: "Pathwise" });
  ok(r);
  assert.doesNotMatch(r.text, /activation rate|time to value|policy breach|accounts payable|finance buyers/i);
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
test("lookalike: a billing seller gets the billing profile's words as keywords, never SaaS measures or expense words", async () => {
  const r = await call("lookalike_signal_generator", { company: "Pathwise", product_category: "recurring billing and revenue infrastructure", champion_titles: ["CFO", "Revenue Operations Lead"] });
  ok(r);
  assert.match(r.text, /Sector: read from your inputs as SaaS, billing and revenue operations/);
  assert.match(r.text, /### Sector notes: SaaS, billing and revenue operations/);
  assert.doesNotMatch(r.text, /activation|time to value|net revenue retention|accounts payable|card spend|policy breach/i);
});
test("a billing platform sold to a CFO and a Head of Product gets billing roles, measures and questions in every tool", async () => {
  const product_category = "billing and monetization (recurring billing and revenue infrastructure) from Pathwise";
  const rec = (industry, champion_title) => ({ name: industry, industry, acv: 60000, sales_cycle_days: 75, champion_title });
  const BAD = /activation rate|time to value|card spend|policy breach|accounts payable|approval cycle|close the books/i;
  const runs = [
    ["icp_deep_dive", { customers: [rec("Media", "Head of Product"), rec("Gaming", "CFO")], product_category, company: "Pathwise" }],
    ["icp_scoring_model", { product_category, company: "Pathwise", scoring_criteria: [{ criterion: "Segment", importance: "critical", values: ["Media", "Gaming"] }] }],
    ["buyer_group_analyzer", { product_category, company: "Pathwise", typical_champion: "Head of Product", known_stakeholders: ["CFO", "Finance", "Engineering"] }],
    ["tam_sam_som_calculator", { product_category, company: "Pathwise", total_potential_companies: 10000, average_contract_value: 60000 }],
    ["icp_interview_synthesizer", { product_category, company: "Pathwise", interview_notes: [{ customer: "Media", role: "CFO", pain_points: ["billing leakage"] }] }],
    ["icp_evolution_tracker", { product_category, company: "Pathwise", current_icp: "Pathwise: subscription businesses; segments: Media, Gaming; buyer: CFO; champion: Head of Product" }],
    ["lookalike_signal_generator", { product_category, company: "Pathwise", champion_titles: ["CFO", "Head of Product"] }],
  ];
  for (const [tool, args] of runs) {
    const r = await call(tool, args);
    ok(r);
    assert.doesNotMatch(r.text, BAD, tool);
    assert.match(r.text, /billing|invoice|revenue recognition|Revenue Operations|failed payments/i, tool);
  }
});
test("the shared file's neutral objections: no 'national operator' or 'offshore-only' wording is printed", async () => {
  const a = await call("buyer_group_analyzer", { product_category: "managed SD-WAN for branch offices", known_stakeholders: ["CIO"] });
  const b = await call("icp_evolution_tracker", { product_category: "managed SD-WAN for branch offices", current_icp: "enterprises; segments: Banks" });
  for (const r of [a, b]) assert.doesNotMatch(r.text, /national operator|offshore-only|higher than/i);
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
  assert.doesNotMatch(r.text, /activation rate|time to value|onboarding|card spends|policy breach|accounts payable/i);
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

// ---- the sector file of round 2: an investment seller (AI native investment product style) ----
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

// ---- round 2b: product_category in the TAM calculator and in account prioritization (D80: arithmetic, scores and tiers unchanged) ----
const listTools = async () => { const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/list", params: {} }) })); return Object.fromEntries((await r.json()).result.tools.map((t) => [t.name, t])); };
test("tools/list: tam_sam_som_calculator and account_prioritization declare an optional product_category (and company); README and docs say so", async () => {
  const t = await listTools();
  for (const n of ["tam_sam_som_calculator", "account_prioritization"]) {
    assert.equal(t[n].inputSchema.properties.product_category.type, "string", n);
    assert.ok(!(t[n].inputSchema.required || []).includes("product_category"), n);
    assert.equal(t[n].inputSchema.properties.company.type, "string", n);
  }
  const { readFileSync } = await import("node:fs");
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const docs = readFileSync(new URL("../public/docs/index.html", import.meta.url), "utf8");
  const section = (txt, a, b) => txt.slice(txt.indexOf(a), txt.indexOf(b));
  assert.match(section(readme, "#### 4. TAM", "#### 5."), /`product_category`/);
  assert.match(section(readme, "#### 6. Account", "#### 7."), /`product_category`/);
  assert.equal((docs.match(/<code>product_category<\/code>/g) || []).length, 9);
  for (const p of ["tam-sam-som-calculator", "account-prioritization"]) assert.match(readFileSync(new URL(`../public/tools/${p}/index.html`, import.meta.url), "utf8"), /name="product_category"/);
});
test("tam_sam_som_calculator with product_category: sector notes from what you sell; every number identical to the call without it", async () => {
  const base = { total_potential_companies: 800, average_contract_value: 90000, icp_percentage: 25, year1_market_share_target: 2, segment_name: "Banks" };
  const a = await call("tam_sam_som_calculator", base);
  const b = await call("tam_sam_som_calculator", { ...base, product_category: "managed SD-WAN and business internet for companies with many branches", company: "Branchwire" });
  ok(b);
  assert.match(b.text, /Sector: read from your inputs as telecom/);
  assert.match(b.text, /### Sector notes: telecom/);
  assert.match(b.text, /Chief Information Officer|Head of IT Infrastructure/);
  assert.match(b.text, /annual value per customer contract/);
  const nums = (t) => (t.match(/\$[\d.,]+[KMB]?|\b\d[\d,]*(?:\.\d+)?%?/g) || []).filter((x) => /[$%]/.test(x) || x.length > 3);
  const core = (t) => t.slice(t.indexOf("## Input Data"), t.indexOf("## Assumptions")).replace(/ARR|annual value per customer contract/g, "");
  assert.equal(core(a.text), core(b.text));
  assert.match(a.text, /Sector notes: none/);
  assert.doesNotMatch(b.text, /Sector notes: none/);
  void nums;
});
test("account_prioritization with product_category: sector content added; scores, ranks and tiers identical to the call without it", async () => {
  const accounts = [{ name: "A", fit_score: 85, intent_signals: 40, relationship: 60, timing: "now" }, { name: "B", fit_score: 70, intent_signals: 75, relationship: 30, timing: "soon" }, { name: "C", fit_score: 60, intent_signals: 20, relationship: 10, timing: "later" }];
  const a = await call("account_prioritization", { accounts });
  const b = await call("account_prioritization", { accounts, product_category: "IT services and managed service desk", company: "Pathwise" });
  ok(b);
  const table = (t) => t.slice(t.indexOf("## Prioritized Account List"), t.indexOf("## Tier Breakdown"));
  assert.equal(table(a.text), table(b.text));
  assert.match(b.text, /Sector: read from your inputs as ITeS/);
  assert.match(b.text, /RFP[- ]led or relationship[- ]led/);
  assert.match(b.text, /Chief Information Officer/);
  assert.match(b.text, /transition|SLA/);
  assert.doesNotMatch(a.text, /Sector: read/);
});
test("software sellers: keywords come from the nouns of the product text (API platform, API lifecycle management), not CI or testing words", async () => {
  const r = await call("lookalike_signal_generator", { company: "Cloudmoat", product_category: "API platform (API lifecycle management) from Cloudmoat", champion_titles: ["Platform Engineer", "Developer Advocate"] });
  ok(r);
  assert.match(r.text, /"API platform"/);
  assert.match(r.text, /"API lifecycle management"/);
  const ads = r.text.split("## Google Ads Targeting")[1].split("## 6sense")[0];
  assert.doesNotMatch(ads, /CI pipeline|test coverage|open-source alternative|SDK software|developer experience software/);
});

// ---- round 2c: the 15 answers the judges kept below 4 (evidence/run20/round2) ----
test("gap analysis: in investment management CIO is the Chief Investment Officer; a bracketed list stays whole; asset managers are related to investment managers, not outside", async () => {
  const r = await call("icp_gap_analysis", { company: "Quantara AI", product_category: "AI platform and investment strategies (Quantara Edge from Quantara AI)",
    current_customers: "Quantara AI customers: Asset allocators (pensions; insurers; endowments), Investment banks, Wealth managers, Asset managers. The metric figures sent are hypothetical.",
    ideal_icp: "asset allocators, investment managers and banks, with CIO as the buyer, who face static factor exposures and black box signals" });
  ok(r);
  assert.match(r.text, /CIO is one of the roles usual in [^\n]*\(Chief Investment Officer\)/);
  assert.doesNotMatch(r.text, /In both: [^\n]*\(pensions\./);
  assert.match(r.text, /Asset allocators \(pensions; insurers; endowments\)/);
  assert.doesNotMatch(r.text, /not named in your ideal profile\*\*:[^\n]*(?:Asset managers|Wealth managers|Investment banks)/);
  assert.doesNotMatch(r.text, /Segments outside the ideal profile/);
});
test("gap analysis: 'B2B SaaS and software' is related to 'SaaS'; a page claim is not a size qualifier; 'platform leader' is the Platform Engineering Lead", async () => {
  const a = await call("icp_gap_analysis", { current_customers: "Pathwise customers: B2B SaaS and software, Gen AI, Gaming; streaming and entertainment.", ideal_icp: "the world's leading AI, SaaS and consumer subscription businesses, with CFO as the buyer, who face messy pricing" });
  ok(a);
  assert.match(a.text, /(?:Named in both|Covered by your words, not named outright)\*\*: [^\n]*B2B SaaS and software/);   // run 22: "B2B SaaS and software" is recognised as SaaS (covered by the word SaaS when "software" is not in the same phrase)
  assert.doesNotMatch(a.text, /Nothing in common|not named in your ideal profile\*\*: [^\n]*B2B SaaS/);
  const b = await call("icp_gap_analysis", { product_category: "developer testing tools", company: "Cloudmoat", current_customers: "Cloudmoat customers: Financial services, Retail.",
    ideal_icp: "API teams and developers at 500,000 companies, including 98% of the Fortune 500 (page claim), with platform leader as the buyer, who face disconnected tools" });
  ok(b);
  assert.doesNotMatch(b.text, /companies outside Fortune 500|\*\*Size\*\*: companies outside/);
  assert.match(b.text, /Platform leader is one of the roles usual in software, testing and QA tools \(Platform Engineering Lead\)/);
});
test("roles: a person is in one place in the buyer group; any other chief officer is budget or sign-off, not a day-to-day user", async () => {
  const q = await call("buyer_group_analyzer", { product_category: "AI platform and investment strategies", company: "Quantara AI", typical_champion: "portfolio manager", known_stakeholders: ["CIO", "risk teams", "compliance committees"] });
  ok(q);
  assert.doesNotMatch(q.text, /### End User[^\n]*\n\*\*Role\*\*: Portfolio Manager/);
  assert.doesNotMatch(q.text, /### Technical Evaluator[^\n]*\n\*\*Role\*\*: Head of Risk/);
  assert.match(q.text, /### Potential Blocker[^\n]*\n\*\*Role\*\*: risk teams/);
  const t = await call("buyer_group_analyzer", { product_category: "managed SD-WAN for branch offices", company: "Branchwire", typical_champion: "IT Infrastructure Head", known_stakeholders: ["CIO", "IT Infrastructure Head", "Chief Commercial Officer"] });
  assert.doesNotMatch(t.text, /### End User[^\n]*\n\*\*Role\*\*: Chief Commercial Officer/);
  assert.match(t.text, /Chief Commercial Officer \(budget or sign-off\)/);
});
test("evolution tracker: CIO is not listed as missing when the ICP names the CIO in investment management; every segment line has its own words", async () => {
  const r = await call("icp_evolution_tracker", { company: "Quantara AI", product_category: "AI platform and investment strategies (Quantara Edge from Quantara AI)",
    current_icp: "Quantara AI: asset allocators, investment managers and banks; segments: Asset allocators (pensions; insurers; endowments), Investment banks, Wealth managers, Asset managers; buyer: CIO; champion: portfolio manager" });
  ok(r);
  assert.doesNotMatch(r.text, /ICP does not name\*\*: Chief Investment Officer/);
  assert.equal((r.text.match(/\*\*Segment investment managers and banks\*\*/g) || []).length, 0);
  const lines = [...r.text.matchAll(/- \*\*Segment [^\n]+/g)].map((m) => m[0].replace(/\*\*Segment [^*]+\*\*/, ""));
  assert.ok(lines.length >= 4);
  assert.ok(new Set(lines.map((l) => l.slice(0, 40))).size >= 3, "the segment lines are not one repeated sentence");
  assert.match(r.text, /split it by the parts you named \(pensions, insurers and endowments\)/);
});
test("interview: a partner quote is attributed to a partner by the input's own label; a quote with its source in front keeps the source as attribution", async () => {
  const r = await call("icp_interview_synthesizer", { product_category: "modernization engineering services", company: "Pathwise", interview_notes: [{ customer: "BFSI", role: "CIO", pain_points: ["slow modernization"],
    value_realized: ["CIO of a US energy firm: a cloud based ERP was needed within 60 days and Pathwise came through (customer quote)", "Microsoft's CVP thanks Pathwise as a global partner (partner quote)"] }] });
  ok(r);
  assert.match(r.text, /> \(Partner[^\n]*written in value_realized/);
  assert.match(r.text, /> "a cloud based ERP was needed within 60 days and Pathwise came through"\s*\n> \(Customer: CIO of a US energy firm; written/);
  assert.doesNotMatch(r.text, /> \(Customer[^\n]*Microsoft/);
});
test("lookalike: filters are built from clean industry terms; the Google keywords come from the product text; a long product is never cut with an ellipsis; no empty heading", async () => {
  const r = await call("lookalike_signal_generator", { company: "Quantara AI", product_category: "AI platform and investment strategies (Quantara Edge from Quantara AI)", champion_titles: ["portfolio manager", "CIO"],
    icp_firmographics: { industries: ["Asset allocators (pensions, insurers, endowments)", "Investment banks"] } });
  ok(r);
  const filters = r.text.split("## Google Ads")[0].split("## LinkedIn")[1];
  assert.doesNotMatch(filters, /\(pensions/);
  assert.match(filters, /Industry: Asset allocators OR pensions OR insurers OR endowments OR Investment banks/);
  const ads = r.text.split("## Google Ads Targeting")[1].split("## 6sense")[0];
  assert.match(ads, /"AI platform"/);
  assert.match(ads, /"investment strategies"/);
  const long = await call("lookalike_signal_generator", { company: "Lanehop", product_category: "sales force automation and distributor management software for CPG and FMCG route to market and field teams across many regions of the country", champion_titles: ["Head of Sales"] });
  assert.doesNotMatch(long.text, /\.\.\."/);
  for (const t of [r, long, await call("lookalike_signal_generator", { company: "Pathwise", product_category: "recurring billing and revenue infrastructure", champion_titles: ["CFO"] })]) assert.doesNotMatch(t.text, /### Sector notes: [^\n]*\n\s*\n\s*(?:###|---|\*\*)/);
});
test("scoring evidence: CFO is found in a statement that names a CFO; a group word is never found inside one title; the 'already a criterion' line agrees with the evidence", async () => {
  const r = await call("icp_scoring_model", { product_category: "spend management software", company: "Spendrill",
    success_correlation: "Sula Vineyards CFO on the home page: the tool cut a 60 day cycle to 10 days (customer quote); Nivea Sr. Sales Automation Manager: helped us grow our top line (customer quote)",
    scoring_criteria: [{ criterion: "Buyer or champion role", importance: "important", values: ["CFO", "managers", "employees"] }, { criterion: "Segment", importance: "critical", values: ["Retail", "Banks"] }] });
  ok(r);
  assert.match(r.text, /Buyer or champion role, "CFO": named in "Sula Vineyards CFO/);
  assert.doesNotMatch(r.text, /"managers": named in/);
  assert.doesNotMatch(r.text, /No statement names these yet[^\n]*: [^\n]*"CFO"/);
  assert.match(r.text, /already a criterion: \*\*Buyer or champion role\*\*/);
  assert.match(r.text, /- "Sula Vineyards CFO[^\n]*": a customer statement/);
  assert.doesNotMatch(r.text, /already a criterion: [^\n]*\*\*Segment\*\*/);
});
