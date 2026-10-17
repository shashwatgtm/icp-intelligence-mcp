// Run 21c job 2 (test first, then the fix): the E10 check found tools printing the notes of another kind of company. Causes fixed in the
// shared reader (src/verticals.ts): a text was cut at "for testing ..." or "for DevSecOps: ..." as if a buyer followed; "AI agents" first in a
// feature list hid the product category named after it; a few category nouns were missing (ticketing, change orders, SMS, visibility ...).
// Companies are described in plain words (no names). Run: node --test tests/run21c-reader.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const mod = await import(new URL("../src/verticals.ts", import.meta.url));
const { detectVertical, detectModel, SUBTYPES } = mod;
const read = (input) => { const v = detectVertical(input); return { id: v ? v.id : null, sub: v ? v.subtype || null : null }; };

const ROWS = [
  ["a cloud platform for testing websites and mobile apps on real devices, with test automation and AI agents", "software", "testing"],
  ["a platform for DevSecOps: planning, source code management, built in CI/CD, application security testing and compliance", "software", "developer-platform"],
  ["a retail intelligence platform for route to market: sales force automation, a distributor management system and AI agents", "vertical-saas", "fmcg-retail-execution"],
  ["AI agents, a copilot that guides human agents, ticketing with routing, messaging and live chat, a knowledge base", "saas", "customer-service"],
  ["a payments and banking platform: accept online payments, make payouts and open business accounts", "fintech", "payments-banking"],
  ["enterprise architecture, development, modernization and management of applications; cloud native development and DevSecOps", "ites", "digital-engineering"],
  ["mobile and web project management that connects field and office, change orders, RFIs and submittals, daily logs", "vertical-saas", "construction"],
  ["phishing and scam messages travel over SMS; unify messages over SMS and WhatsApp business API with one API", "telecom", "cpaas-messaging"],
  ["Acme is CRM for sales, marketing and service teams: leads, pipeline, workflow automation", "saas", "crm-marketing"],
  ["Payroll and compliance platform for small businesses in India", "saas", null],
  ["Payroll and shift scheduling software for restaurants", "vertical-saas", "industry-hr-payroll"],
  ["HR and payroll software for construction crews", "vertical-saas", "industry-hr-payroll"],
  ["enterprise connectivity with SD-WAN and business internet so retail chains keep every store online", "telecom", "operators-connectivity"],
  ["a decision platform that joins transportation management, shipment and inventory visibility on every mode", "logistics-tech", null],
];
for (const [text, sector, sub] of ROWS) {
  test(`reads as ${sector}${sub ? ", " + sub : ", no kind"}: ${text.slice(0, 60)}`, () => {
    const r = read({ seller: [text] });
    assert.equal(r.id, sector, `sector of: ${text}`);
    assert.equal(r.sub, sub, `sub-type of: ${text}`);
  });
}

test("AI agents named as the product still read as AI native", () => {
  assert.equal(read({ seller: ["AI agents that handle contact centre calls"] }).id, "ai-native");
  assert.equal(read({ seller: ["AI agents for customer experience"] }).id, "ai-native");
});

test("a messaging platform sold per message gets the per-transaction model, not connectivity", () => {
  const m = detectModel(undefined, { seller: ["an SMS platform that sends business messages over SMS and WhatsApp business API"] });
  assert.equal(m.model, "transactions");
});

test("a seller that names a testing platform is not read as a developer platform because DevOps is in the problem text", () => {
  const r = read({ seller: ["testing in the DevOps cycle is increasingly complex across many devices"], context: ["an open and flexible test platform on real devices"] });
  assert.notEqual(r.sub, "developer-platform");
});


test("the telecom vocabulary spells SD-WAN with a hyphen", () => {
  const t = SUBTYPES.find((x) => x.id === "operators-connectivity");
  assert.ok(t.notes.vocabulary.includes("SD-WAN"));
  assert.ok(!t.notes.vocabulary.includes("SD WAN"));
});

test("an enterprise network, cloud and security provider is a connectivity business, not a software subscription", () => {
  const m = detectModel(undefined, { seller: ["global digital ecosystem enabler: enterprise network, cloud, security, interactions and IoT services"] });
  assert.equal(m.model, "connectivity");
});

test("a retail intelligence platform for route to market reads as vertical SaaS even though the text is cut at 'for'", () => {
  assert.equal(read({ seller: ["retail intelligence platform for route to market (RTM) from the vendor"] }).id, "vertical-saas");
});
