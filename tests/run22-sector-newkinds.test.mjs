// Run 22 (test first): three kinds of company the fresh judges found without sector notes of their own: mobile application security testing,
// core banking platforms and managed data infrastructure. Each was read as a neighbouring kind (developer security, payments and banking APIs,
// plain software) whose notes do not fit. Vocabulary only, no figure or company name (rule B82). Invented descriptions only.
// Same file in every repo that holds the shared sector file; GTM Alpha's copy points at netlify/lib/verticals.js.
import { test } from "node:test";
import assert from "node:assert/strict";

const MODULE = process.env.VERTICALS_MODULE || "../dist/verticals.js";
const { explainSector, SUBTYPES } = await import(new URL(MODULE, import.meta.url));
const read = (text) => explainSector({ seller: [text] }).vertical;

test("a mobile application security testing platform reads as its own kind of cybersecurity", () => {
  const v = read("An enterprise mobile application security testing platform that scans app binaries for both Android and iOS with static, dynamic and API testing and compliance evidence");
  assert.equal(v && v.id, "cybersecurity");
  assert.equal(v.subtype, "mobile-appsec");
});

test("the mobile application security notes talk about releases and findings, not attack surface or alerts", () => {
  const v = read("Mobile application security testing for banks: automated scans of app binaries before every release");
  assert.equal(v.subtype, "mobile-appsec");
  const text = JSON.stringify([v.vocabulary, v.committee, v.objections, v.metrics, v.discovery]).toLowerCase();
  assert.ok(/release/.test(text) && /finding/.test(text), text.slice(0, 200));
  assert.ok(!/attack surface|alert fatigue|least privilege|mean time to detect/.test(text), text.slice(0, 300));
});

test("a code scanner for developers stays the application and developer security kind", () => {
  const v = read("Static application security testing and software composition analysis that run in the developer pipeline");
  assert.equal(v.subtype, "appsec");
});

test("a core banking platform reads as core banking, not payments APIs", () => {
  const v = read("A cloud native core banking platform that lets banks and lenders run deposits, loans and accounts on one ledger");
  assert.equal(v && v.id, "fintech");
  assert.equal(v.subtype, "core-banking");
});

test("the core banking notes talk about migration and regulators, not payment success or chargebacks", () => {
  const v = read("A core banking system for digital banks with product configuration and a ledger");
  assert.equal(v.subtype, "core-banking");
  const text = JSON.stringify([v.vocabulary, v.committee, v.objections, v.metrics, v.discovery]).toLowerCase();
  assert.ok(/migrat/.test(text) && /regulat/.test(text), text.slice(0, 200));
  assert.ok(!/chargeback|payment success|sponsor bank|tokenis/.test(text), text.slice(0, 300));
});

test("a payment gateway is still the payments and banking kind", () => {
  const v = read("A payment gateway and payment processing platform for online merchants with card acquiring");
  assert.equal(v.subtype, "payments-banking");
});

test("managed data infrastructure reads as its own kind of software", () => {
  const v = read("Managed open source data infrastructure: hosted Kafka, PostgreSQL and ClickHouse on every major cloud with backups, upgrades and failover");
  assert.equal(v && v.id, "software");
  assert.equal(v.subtype, "data-infrastructure");
});

test("the data infrastructure notes talk about operations hours and lock in, not release frequency or seats", () => {
  const v = read("A managed database service for Postgres and MySQL with automatic failover and backups");
  assert.equal(v.subtype, "data-infrastructure");
  const text = JSON.stringify([v.vocabulary, v.committee, v.objections, v.metrics, v.discovery]).toLowerCase();
  assert.ok(/operations hours|on call/.test(text) && /lock in/.test(text), text.slice(0, 200));
  assert.ok(!/release frequency|build time|per seat/.test(text), text.slice(0, 300));
});

test("a build service for developers is not managed data infrastructure", () => {
  const v = read("A hosted continuous integration service that builds, tests and deploys code for developer teams");
  assert.notEqual(v.subtype, "data-infrastructure");
});

test("the new kinds' text has no digit, long dash, health word or named company", () => {
  for (const id of ["mobile-appsec", "core-banking", "data-infrastructure"]) {
    const st = SUBTYPES.find((s) => s.id === id);
    assert.ok(st, `${id} missing`);
    const text = JSON.stringify([st.name, st.notes]);
    assert.ok(!/[0-9–—]/.test(text), `${id}: digit or long dash`);
    assert.ok(!/clinic|pharmac|patient|hospital|medical|health/i.test(text), `${id}: health word`);
  }
});
