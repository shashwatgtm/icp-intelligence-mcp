// Run 20 round 1 fix (a), step 1 (written before the fix): the table of seller descriptions read by detectVertical and
// detectModel (src/verticals.ts). Rows are in tests/fixtures/run20-sector-table.json: 5 per vertical for the 9 verticals
// (45 rows, the owner's ten among them, word for word) plus extra hard cases, and a second table of tool-call style
// cases (the seller's fields first, the buyer's fields second, as the tools pass them).
// The rules under test (owner decision D92): the seller's own words decide the sector; the buyer's words only when the
// seller's words name none; one unmistakable word is enough; broad words never decide alone; devices make hardware only
// when the seller sells devices; software sold to money managers is a software subscription; payments are per transaction.
// Run: node --test tests/run20-sector-table.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mod = await import(new URL("../src/verticals.ts", import.meta.url));
const { detectVertical, detectModel } = mod;
const table = JSON.parse(readFileSync(new URL("./fixtures/run20-sector-table.json", import.meta.url), "utf8"));
const IDS = ["logistics-tech", "fintech", "saas", "vertical-saas", "ai-native", "ites", "telecom", "software", "cybersecurity"];
const MODELS = ["saas", "services", "connectivity", "transactions", "marketplace", "hardware_software", "investment"];

test("the table has at least 45 descriptions, 5 or more per vertical, every model, and the owner's ten rows", () => {
  const rows = table.descriptions;
  assert.ok(rows.length >= 45, `only ${rows.length} rows`);
  for (const id of IDS) assert.ok(rows.filter((r) => r.sector === id).length >= 5, `fewer than 5 rows for ${id}`);
  for (const m of MODELS) assert.ok(rows.some((r) => r.model === m), `no row with model ${m}`);
  assert.deepEqual(rows.filter((r) => r.owner).map((r) => r.owner).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(table.toolcalls.length >= 10);
});

// Table 1: one description typed by a user (the legacy call: plain strings).
for (const r of table.descriptions) {
  test(`description ${r.id}${r.owner ? ` (owner case ${r.owner})` : ""}: ${r.text}`, () => {
    const v = detectVertical(r.text);
    assert.equal(v ? v.id : null, r.sector, "sector");
    if (r.model) assert.equal(detectModel(undefined, r.text).model, r.model, "model");
  });
}

// Table 2: the same kind of text split into the seller's fields first and the buyer's fields second, as the tools pass them
// (free text about the deal goes last, as "context"; there a strong word needs a second sector word beside it).
for (const r of table.toolcalls) {
  test(`tool call ${r.id}: seller ${JSON.stringify(r.seller)} / buyer ${JSON.stringify(r.buyer)}${r.context ? ` / context ${JSON.stringify(r.context)}` : ""}`, () => {
    const input = { seller: r.seller, buyer: r.buyer || [], context: r.context || [], role: r.role || [] };
    const v = detectVertical(input);
    assert.equal(v ? v.id : null, r.sector, "sector");
    assert.equal(detectModel(undefined, input).model, r.model, "model");
  });
}

test("the order rule: swapping seller and buyer words changes the sector; buyer words count only when the seller names none", () => {
  const a = detectVertical({ seller: ["Cloud security platform"], buyer: ["Banks"] });
  const b = detectVertical({ seller: ["Banks"], buyer: ["Cloud security platform"] });
  assert.equal(a && a.id, "cybersecurity");
  assert.equal(b && b.id, "fintech");
  // buyer words alone still name a sector when the seller words name none
  assert.equal(detectVertical({ seller: ["our solution"], buyer: ["Freight forwarders"] })?.id, "logistics-tech");
  assert.equal(detectVertical({ seller: [], buyer: [] }), null);
  assert.equal(detectVertical({ seller: ["our solution"], buyer: ["Technology"] }), null);
});

test("broad words never decide a sector alone", () => {
  for (const w of ["sites", "branches", "operators", "voice", "credit", "funds", "forecasts", "release", "code"]) {
    assert.equal(detectVertical(w), null, `${w} alone must not decide a sector`);
  }
  assert.equal(detectVertical("branches sites operators voice credit funds forecasts release code"), null);
  // they count together with a strong word
  assert.equal(detectVertical("SD-WAN for branches and sites")?.id, "telecom");
  assert.equal(detectVertical("Voice calling on SIP trunks for operators")?.id, "telecom");
});

test("one unmistakable sector word is enough", () => {
  const one = { "SD-WAN": "telecom", CNAPP: "cybersecurity", BPO: "ites", "3PL": "logistics-tech", SOC: "cybersecurity", SIEM: "cybersecurity", payments: "fintech", KYC: "fintech", fleet: "logistics-tech", "last-mile": "logistics-tech" };
  for (const [w, id] of Object.entries(one)) assert.equal(detectVertical(w)?.id, id, `${w} should name ${id}`);
});

test('"AI agents that" counts both phrases (the second no longer swallowed by the first)', () => {
  const x = mod.explainSector("AI agents that resolve tickets");
  assert.equal(x.vertical?.id, "ai-native");
  assert.ok(x.strong.includes("ai agents") && x.strong.includes("agents that"), JSON.stringify(x));
});

test("devices make hardware only when the seller sells devices", () => {
  assert.notEqual(detectModel(undefined, "Test websites on real devices and browsers").model, "hardware_software");
  assert.notEqual(detectModel(undefined, "Cloud lab that gives QA teams access to real devices").model, "hardware_software");
  assert.equal(detectModel(undefined, "Software that manages mobile devices for IT teams").model, "saas");
  assert.equal(detectModel(undefined, { seller: ["Cloud platform"], buyer: ["Teams that test on devices"] }).model, "saas");
  assert.equal(detectModel(undefined, "We make IoT sensors and a cloud dashboard").model, "hardware_software");
  assert.equal(detectModel(undefined, "Rugged terminals plus software for warehouses").model, "hardware_software");
});

test("software sold to asset managers is a subscription; investment only when the seller manages money", () => {
  assert.equal(detectModel(undefined, "Reporting software for fund managers and family offices").model, "saas");
  assert.equal(detectModel(undefined, "Investment management firm that runs equity funds and charges fees on assets").model, "investment");
});

test("an explicit business model still wins, and the sector's usual model is the last resort", () => {
  assert.deepEqual(detectModel("services", "SaaS for fleets"), { model: "services", how: "input" });
  assert.equal(detectModel(undefined, "Cybersecurity company").how, "sector");
  assert.deepEqual(detectModel(undefined, "hello"), { model: null, how: "unknown" });
});

// ---------------------------------------------------------------------------------------------------------------------------
// Run 20 round 2 (fresh judges, set T): the AI native entry is neutral about what the AI does; support-automation words live in a
// support sub-case; a seller that manages money gets the investment notes, never the support or corporate-finance ones.
// ---------------------------------------------------------------------------------------------------------------------------
const { VERTICALS, aiUseCase, profileFor, INVESTMENT_PROFILE, AI_SUPPORT_PROFILE } = mod;
const SUPPORT_WORDS = /resolution|handling time|escalation|evaluation set|ticket|junior|contact cent|help ?desk|service desk|customer satisfaction|automation rate|support/i;
const FINANCE_WORDS = /close the books|reconcil|month-end|policy breach|accounts payable|ERP|ledger|payment success|treasury/i;
const flat = (v) => JSON.stringify({ n: v.vocabulary, r: v.buyerRoles, c: v.committee, o: v.objections, s: v.salesMotion, m: v.metrics, p: v.proofShape, d: v.discovery });

test("the AI native entry is neutral: no support-automation words, the neutral measures, roles and proof shape", () => {
  const ai = VERTICALS.find((v) => v.id === "ai-native");
  assert.doesNotMatch(flat(ai), SUPPORT_WORDS);
  const text = flat(ai);
  for (const w of [/accuracy/i, /cost per case/i, /person has to step in|step in/i, /time to a working pilot/i, /own data/i, /explain/i, /vendor/i, /where .*data|data .*(?:goes|leave|stored)/i, /existing systems|integrat|fit/i]) assert.match(text, w, String(w));
  assert.ok(ai.buyerRoles.some((r) => /Data and AI|Technology/i.test(r)), "a technical owner");
  assert.ok(ai.buyerRoles.some((r) => /Risk|Compliance|Security|CISO/i.test(r)), "a risk or compliance reviewer");
  assert.ok(ai.buyerRoles.some((r) => /owner|process|function/i.test(r)), "the owner of the problem");
  assert.doesNotMatch(text, /\d/, "no figure in the AI native notes (B82)");
});

test("aiUseCase: support only when the seller's own text names support, tickets, help desk, contact centre or service desk", () => {
  assert.equal(aiUseCase("AI agents that resolve customer support tickets for online retailers"), "support");
  assert.equal(aiUseCase("Voice AI for contact centres"), "support");
  assert.equal(aiUseCase({ seller: ["AI help desk assistant"], buyer: ["Retailers"] }), "support");
  assert.equal(aiUseCase({ seller: ["AI agent for IT service desk requests"] }), "support");
  assert.equal(aiUseCase("AI-native investment strategies company for asset allocators, investment managers and banks"), "investment");
  assert.equal(aiUseCase({ seller: ["An AI-native investment strategies company"], buyer: ["Asset allocators"] }), "investment");
  assert.equal(aiUseCase("AI agents that review contracts for legal teams"), "other");
  assert.equal(aiUseCase("LLM gateway with support for many models"), "other");
  assert.equal(aiUseCase({ seller: ["AI platform for sales forecasts"], buyer: ["Teams that handle support tickets"] }), "other", "buyer words do not make it support");
  assert.equal(aiUseCase("hello"), "other");
});

test("detectVertical gives the support notes only to an AI native seller that sells support automation", () => {
  const sup = detectVertical("AI agents that resolve customer support tickets for online retailers");
  assert.equal(sup.id, "ai-native");
  assert.match(flat(sup), /resolution rate/i);
  assert.match(flat(sup), /escalation rate/i);
  assert.equal(sup.metrics, AI_SUPPORT_PROFILE.metrics);
  for (const t of ["AI agents that review contracts and flag risky clauses for legal teams", "AI platform that forecasts demand and suggests prices for retailers", "AI-native investment strategies company for asset allocators, investment managers and banks"]) {
    const v = detectVertical(t);
    assert.equal(v.id === "ai-native" || v.id === "fintech", true, t);
    assert.doesNotMatch(flat(v), SUPPORT_WORDS, t);
  }
  assert.equal(detectVertical({ seller: ["AI agents for underwriting decisions"], buyer: ["Insurers"] }).metrics.some((m) => /handling time/.test(m)), false);
  // other sectors are not changed by the sub-case
  assert.equal(detectVertical("Cloud security platform for banks").id, "cybersecurity");
});

test("an investment-management seller gets investment roles and measures, never the support or corporate-finance notes", () => {
  for (const input of [
    "AI-native investment strategies company for asset allocators, investment managers and banks",
    { seller: ["An AI-native investment strategies company"], buyer: ["Asset allocators", "Investment managers", "Banks"], role: ["Chief Investment Officer"] },
    "Wealth management firm that manages client portfolios and charges a fee on assets under management",
  ]) {
    const m = detectModel(undefined, input).model;
    assert.equal(m, "investment");
    const v = profileFor(detectVertical(input), m, input);
    for (const r of [/Chief Investment Officer/, /Manager Research/, /Investment Committee/, /Consultant/, /Risk/, /Compliance/]) assert.match(v.buyerRoles.join("; "), r);
    assert.match(v.metrics.join("; "), /benchmark|drawdown|tracking error/i);
    assert.doesNotMatch(flat(v), SUPPORT_WORDS);
    assert.doesNotMatch(flat(v), FINANCE_WORDS);
    assert.match(v.name, /investment management/);
    assert.equal(profileFor(v, m, input).name, v.name, "applying it twice changes nothing");
  }
  assert.equal(INVESTMENT_PROFILE.buyerRoles.some((r) => /Chief Investment Officer/.test(r)), true);
  assert.doesNotMatch(JSON.stringify(INVESTMENT_PROFILE), /\d/, "no figure (B82)");
});

test("profileFor leaves every other sector and model alone", () => {
  for (const v of VERTICALS) assert.equal(profileFor(v, "saas", "x"), v, v.id);
  const sup = detectVertical("AI agents that resolve support tickets");
  assert.equal(profileFor(VERTICALS.find((v) => v.id === "ai-native"), "saas", "AI agents that resolve support tickets"), sup);
  assert.equal(profileFor(null, "investment", "x"), null);
  const sec = detectVertical("Cloud security platform for banks");
  assert.equal(profileFor(sec, "saas", "Cloud security platform for banks"), sec);
});

test("services words beat the AI-native label, but AI agents or an AI platform stay AI native", () => {
  assert.equal(detectVertical("AI-native business services").id, "ites");
  assert.equal(detectVertical("AI-native managed services for IT operations").id, "ites");
  assert.equal(detectVertical("AI agents that run on an AI platform").id, "ai-native");
  assert.equal(detectVertical("AI platform").id, "ai-native");
  assert.equal(detectVertical("AI agents for BPO companies").id, "ai-native");
  assert.equal(detectModel(undefined, "AI-native business services").model, "services");
  assert.equal(detectModel(undefined, "AI platform for business teams").model, "saas");
});

test("connectivity words beside security words read telecom unless the seller is a security vendor; security operations for telecom stays cybersecurity", () => {
  assert.equal(detectVertical("Global network and security services provider").id, "telecom");
  assert.equal(detectVertical("Connectivity and managed security services").id, "telecom");
  assert.equal(detectVertical("Managed SD-WAN with built-in firewall").id, "telecom");
  assert.equal(detectVertical("Security operations platform for telecom operators").id, "cybersecurity");
  assert.equal(detectVertical("Cybersecurity vendor with SD-WAN").id, "cybersecurity");
  assert.equal(detectVertical("Network detection and response security platform").id, "cybersecurity");
  assert.equal(detectVertical("Cloud security posture management").id, "cybersecurity");
  assert.equal(detectVertical("SIEM and managed network").id, "cybersecurity", "a specialist security product word keeps it cybersecurity");
  assert.equal(detectModel(undefined, "Security platform with SD-WAN and zero trust").model, "saas");
});

// ---------------------------------------------------------------------------------------------------------------------------
// Run 20 round 2b (fresh judges): objections are worded as what the BUYER says, never assuming the seller's size; a SaaS seller
// of billing and revenue operations gets its own notes, not the finance block of the spend-management profile.
// ---------------------------------------------------------------------------------------------------------------------------
const { BILLING_PROFILE, isBillingSeller } = mod;
const CHALLENGER = /national operator|offshore-only|incumbent|higher than|cheaper than us|than the (?:big|large|national)|challenger|underdog|start-?up|small(?:er)? (?:vendor|firm|player)/i;

test("every objection is worded as what the buyer says, never assuming the seller is a challenger or a large operator", () => {
  const all = [...VERTICALS, { id: "investment", name: "investment", ...INVESTMENT_PROFILE }, { id: "billing", name: "billing", ...BILLING_PROFILE }, { id: "ai-support", name: "ai support", ...AI_SUPPORT_PROFILE }];
  for (const v of all) for (const o of v.objections) {
    assert.doesNotMatch(o.objection, CHALLENGER, `${v.id}: ${o.objection}`);
    assert.doesNotMatch(o.response, CHALLENGER, `${v.id}: ${o.response}`);
  }
  const tel = VERTICALS.find((v) => v.id === "telecom").objections.map((o) => o.objection);
  assert.ok(tel.includes("Price per site compared with the operator we use today"), tel.join("; "));
  const ites = VERTICALS.find((v) => v.id === "ites").objections.map((o) => o.objection);
  assert.ok(ites.includes("The offshore alternative is cheaper"), ites.join("; "));
});

test("billing seller bought by finance: its own roles, measures, objections and proof shape, none of the spend-management block", () => {
  const input = { seller: ["Subscription billing and invoicing platform"], buyer: ["SaaS companies"], role: ["CFO", "Revenue Operations Lead"] };
  assert.equal(isBillingSeller(input), true);
  const v = detectVertical(input);
  assert.equal(v.id, "saas");
  assert.match(v.name, /billing/i);
  for (const r of [/Chief Financial Officer/, /VP Finance/, /Revenue Operations/, /Billing|Finance Operations/, /Engineering/]) assert.match(v.buyerRoles.join("; "), r);
  const metrics = v.metrics.join("; ");
  for (const w of [/invoice accuracy/i, /failed payments recovered/i, /revenue recognition errors/i, /days to close/i, /new pricing model/i, /billing disputes|disputes/i]) assert.match(metrics, w, String(w));
  const objections = v.objections.map((o) => o.objection).join("; ");
  for (const w of [/homegrown billing/i, /live subscriptions/i, /ERP|CRM/, /revenue recognition|audit trail/i]) assert.match(objections, w, String(w));
  assert.match(v.proofShape, /live subscriptions/i);
  assert.match(v.proofShape, /pricing change/i);
  assert.match(v.proofShape, /without engineering/i);
  assert.doesNotMatch(flat(v), /accounts payable|policy breach|card spend|claims|close the books|reimburs|approval cycle/i);
  assert.doesNotMatch(flat(v), /\d/, "no figure (B82)");
  assert.equal(profileFor(v, "saas", input), v);
  // the same through plain text and the other billing words
  for (const t of ["Dunning and proration engine for subscription businesses", "Usage-based pricing and monetization platform", "Billing, invoicing and revenue recognition software"]) assert.match(detectVertical(t).name, /billing/i, t);
  // the investment notes still come first
  assert.match(profileFor(v, "investment", input).name, /investment management/);
});

test("a spend-management seller keeps the finance block; a billing seller bought by engineering keeps the plain SaaS notes", () => {
  for (const t of ["Spend management platform with corporate cards, expense claims and invoice approvals", "Accounts payable automation and invoice processing", "Reimbursements and travel expense app"]) {
    const v = detectVertical({ seller: [t], role: ["CFO"] });
    assert.equal(v.id, "fintech", t);
    assert.equal(isBillingSeller({ seller: [t], role: ["CFO"] }), false, t);
    assert.match(flat(v), /accounts payable|close the books|reconcil/i);
  }
  assert.equal(isBillingSeller({ seller: ["Payment processing and billing for merchants"] }), false, "moves money");
  const eng = detectVertical({ seller: ["Billing platform"], role: ["CTO"] });
  assert.equal(eng, VERTICALS.find((v) => v.id === "saas"));
  assert.equal(isBillingSeller({ seller: ["Billing platform"], role: ["CTO"] }), false);
  assert.equal(detectVertical("Cloud security platform for banks").id, "cybersecurity");
});

test("a SaaS product bought by IT leaders stays plain SaaS, and IT asset management is not money management", () => {
  const v = detectVertical({ seller: ["SaaS management platform that tracks licences and renewals"], buyer: ["IT leaders"], role: ["GM IT", "CIO"] });
  assert.equal(v, VERTICALS.find((x) => x.id === "saas"));
  for (const t of ["IT asset management software", "IT asset management for enterprises", "Digital asset management for marketing teams"]) {
    assert.notEqual(detectVertical(t)?.id, "fintech", t);
    assert.notEqual(detectModel(undefined, t).model, "investment", t);
  }
  assert.equal(detectVertical("Asset management firm for pension funds")?.id, "fintech");
  assert.equal(detectModel(undefined, "Asset management firm for pension funds").model, "investment");
});

// ---------------------------------------------------------------------------------------------------------------------------
// Run 20 round 2c: the two guards that lived in Revenue's readContext now live in the shared reader.
// (1) "AI-native", "GenAI", "AI agents" and similar are a way of building; when they are the only AI words and the seller's text
//     also names a trade, the trade decides. (2) The sector's usual business model is that of the sector finally chosen.
// ---------------------------------------------------------------------------------------------------------------------------
test("a marketing AI label beside a trade word: the trade decides the sector, and the usual model follows the new sector", () => {
  const cases = [["GenAI business services", "ites", "services"], ["AI-native security platform", "cybersecurity", "saas"], ["GenAI testing cloud", "software", "saas"],
    ["AI-native sales force automation", "vertical-saas", "saas"], ["AI-native payments platform", "fintech", "transactions"], ["AI-native billing", "saas", "saas"], ["AI-first freight forwarding", "logistics-tech", "saas"]];
  for (const [t, sector, model] of cases) {
    assert.equal(detectVertical(t)?.id, sector, t);
    assert.equal(detectModel(undefined, t).model, model, t);
    const x = mod.explainSector(t);
    assert.equal(x.source, "seller");
    assert.ok(!x.strong.every((w) => /^(?:ai|ai[- ]native|ai[- ]first|genai)$/.test(w)), `the words that decided it name the trade: ${JSON.stringify(x.strong)}`);
  }
  // the usual model of the final sector, not of AI native: nothing in the text names a model
  assert.deepEqual(detectModel(undefined, "AI-native outsourcing"), { model: "services", how: "read" });
  assert.equal(detectModel(undefined, { seller: ["our solution"], buyer: [] }).model, null);
  assert.deepEqual(detectModel(undefined, "GenAI back-office"), { model: "services", how: "sector" });
  // ITeS sold on a platform is still services unless the seller says subscription, SaaS, per seat or licence
  assert.equal(detectModel(undefined, "GenAI business services delivered on a digital platform").model, "services");
  assert.equal(detectModel(undefined, "GenAI business services sold as a SaaS subscription").model, "saas");
});

test("AI words that are not only a label, support automation, and AI native investment sellers stay AI native", () => {
  for (const t of ["AI platform that scans cloud accounts for risk", "AI models that rank leads", "AI agents that resolve customer support tickets", "AI agents that handle contact centre calls", "AI-native contract review", "AI-native platform"]) assert.equal(detectVertical(t)?.id, "ai-native", t);
  assert.equal(detectVertical("AI agents that triage security alerts")?.id, "ai-native", "AI agents are the product, not a label");
  for (const t of ["Investment strategies for asset allocators powered by AI", "AI-driven investment strategies for asset allocators", "AI-native investment strategies company"]) {
    assert.equal(detectVertical(t)?.id, "ai-native", t);
    assert.equal(detectModel(undefined, t).model, "investment", t);
    assert.equal(aiUseCase(t), "investment", t);
  }
  assert.equal(detectVertical("Wealth management firm that manages client portfolios and charges a fee on assets under management").id, "fintech");
  assert.equal(detectVertical("Systematic investment strategies for pension funds").id, "fintech");
  // buyer words alone never turn an AI label into a trade
  assert.equal(detectVertical({ seller: ["AI-native platform"], buyer: ["Banks"] })?.id, "ai-native");
});
