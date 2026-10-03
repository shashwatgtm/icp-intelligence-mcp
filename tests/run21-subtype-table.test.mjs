// Run 21b step 1 (test first): sub-types of the nine verticals and the product-category-first reading (src/verticals.ts).
// Rows are in tests/fixtures/run21-subtype-table.json: two plain-word descriptions per sub-type plus plain-word versions of the run 21a
// misses (a messaging platform read as cybersecurity, customer service software read as AI native, a bank account data API read as software,
// a construction platform read as no sector, a freight marketplace given the wrong model). No company names.
// Run: node --test tests/run21-subtype-table.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mod = await import(new URL("../src/verticals.ts", import.meta.url));
const { detectVertical, detectModel, VERTICALS, SUBTYPES, profileFor } = mod;
const table = JSON.parse(readFileSync(new URL("./fixtures/run21-subtype-table.json", import.meta.url), "utf8"));
const flat = (v) => JSON.stringify({ n: v.vocabulary, r: v.buyerRoles, c: v.committee, o: v.objections, s: v.salesMotion, m: v.metrics, p: v.proofShape, d: v.discovery });

test("the table covers every sub-type at least twice and all nine verticals", () => {
  assert.ok(table.rows.length >= 2 * SUBTYPES.length - 2, `only ${table.rows.length} rows for ${SUBTYPES.length} sub-types`);
  for (const t of SUBTYPES) if (t.id !== "billing-revenue") assert.ok(table.rows.filter((r) => r.subtype === t.id).length >= 2, `fewer than 2 rows for ${t.id}`);
  for (const v of VERTICALS) assert.ok(SUBTYPES.filter((t) => t.vertical === v.id).length >= 3, `fewer than 3 sub-types for ${v.id}`);
});

for (const r of table.rows) {
  test(`row ${r.id}: ${r.text}`, () => {
    const v = detectVertical(r.text);
    assert.equal(v ? v.id : null, r.sector, "sector");
    if (r.subtype && r.subtype !== "billing-revenue") assert.equal(v.subtype, r.subtype, "sub-type");
    if (r.model) assert.equal(detectModel(undefined, r.text).model, r.model, "model");
  });
}

test("the owner's three product category cases are read by the product, not the buzzword", () => {
  assert.equal(detectVertical("Customer service software with AI agents, ticketing and a help center").id, "saas");
  assert.equal(detectVertical("API platform that connects apps to users' bank accounts for payments").id, "fintech");
  assert.equal(detectVertical("Construction management software for general contractors").id, "vertical-saas");
});

test("buzzwords still decide when no product category is named, and a real AI product stays AI native", () => {
  assert.equal(detectVertical("AI agents that review contracts and flag risky clauses").id, "ai-native");
  assert.equal(detectVertical("Voice AI for contact centres").id, "ai-native");
  assert.equal(detectVertical("Cloud security platform that finds misconfigurations").id, "cybersecurity");
  assert.equal(detectVertical("Messaging platform with fraud filtering and phishing protection for businesses").id, "telecom");
});

// The neutral entries hold no line written for one kind of company.
const STOCK = {
  fintech: [/month-end/i, /close the books/i, /accounts payable/i, /our ERP already/i],
  "logistics-tech": [/cost per delivery/i, /first-attempt/i, /last-mile/i, /dispatch/i],
  "vertical-saas": [/beat plan/i, /secondary sales/i, /distributor/i, /\bSKU\b/i, /outlet/i],
  telecom: [/SD-WAN/i, /MPLS/i, /leased line/i, /per site/i, /site survey/i],
  cybersecurity: [/misconfiguration/i, /cloud account/i],
  software: [/test coverage/i, /escaped defect/i, /API test/i],
  saas: [/activation/i, /product-led/i],
  ites: [/per FTE/i, /ticket backlog/i, /service desk/i],
};
test("the neutral entry of each vertical holds no stock line of one sub-type", () => {
  for (const [id, res] of Object.entries(STOCK)) {
    const v = VERTICALS.find((x) => x.id === id);
    for (const re of res) assert.doesNotMatch(flat(v), re, `${id}: ${re}`);
  }
});

test("two companies of one vertical get different fitting notes", () => {
  const a = detectVertical("Spend management platform with corporate cards and expense claims");
  const b = detectVertical("API platform that connects apps to users' bank accounts for payments");
  const c = detectVertical("Lending platform with loan origination and credit decisioning");
  assert.deepEqual([a.id, b.id, c.id], ["fintech", "fintech", "fintech"]);
  assert.notEqual(flat(a), flat(b));
  assert.notEqual(flat(b), flat(c));
  assert.match(flat(a), /month-end|close the books|reconcil/i);
  assert.doesNotMatch(flat(b), /month-end|close the books|policy breach/i);
  assert.doesNotMatch(flat(c), /month-end|close the books|policy breach/i);
  const f1 = detectVertical("Freight visibility platform that tracks shipments in real time across carriers");
  const f2 = detectVertical("Last-mile delivery management software with route planning and proof of delivery");
  assert.notEqual(flat(f1), flat(f2));
  assert.doesNotMatch(flat(f1), /cost per delivery|first-attempt/i);
  assert.match(flat(f2), /cost per delivery|first-attempt/i);
});

test("a sub-type is used only when exactly one sub-type of the vertical is named", () => {
  const both = detectVertical("Freight visibility and last-mile delivery management software");
  assert.equal(both.id, "logistics-tech");
  assert.equal(both.subtype, undefined);
  const plain = detectVertical("Logistics software");
  assert.equal(plain.id, "logistics-tech");
  assert.equal(plain.subtype, undefined);
});

test("a sub-type with its own usual model sets it unless the seller says subscription", () => {
  assert.equal(detectModel(undefined, "Online freight marketplace and software where shippers book capacity").model, "marketplace");
  assert.equal(detectModel(undefined, "Messaging platform for business texts and one time passwords").model, "transactions");
  assert.equal(detectModel(undefined, "Subscription messaging platform for business texts").model, "saas");
  assert.equal(detectModel("services", "Messaging platform for business texts").model, "services");
});

test("profileFor keeps a sub-type when called twice and the investment profile still applies", () => {
  const v = detectVertical("Customer service software with AI agents, ticketing and a help center");
  assert.equal(profileFor(v, "saas", "x"), v);
  const w = detectVertical("Wealth management platform for advisers");
  const inv = profileFor(w, "investment", "x");
  assert.match(inv.name, /investment management/);
  assert.equal(profileFor(inv, "investment", "x").name, inv.name);
});

test("no figure, dash or named company in the sub-type text (B82)", () => {
  const all = JSON.stringify(SUBTYPES.map((t) => t.notes)) + JSON.stringify(VERTICALS.map(flat));
  assert.doesNotMatch(all, /\d/);
  assert.doesNotMatch(all, /[–—]/);
});
