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
