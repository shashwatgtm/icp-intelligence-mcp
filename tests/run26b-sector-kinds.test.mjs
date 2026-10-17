// Run 26B (test first): ten kinds of company that fresh judges found read as a neighbouring kind on a test pool, and four reading rules.
// Each test fails on the run 22 sector file and passes once the kind has notes of its own: the sub-sector is recognised, its own words are
// used, and the neighbour's words are not. Plain-word descriptions only: no company name, no figure (rules B81 and B82).
// Same file in every repo that holds the shared sector file; GTM Alpha's copy reads netlify/lib/verticals.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const own = new URL("../src/verticals.ts", import.meta.url);
const MODULE = process.env.VERTICALS_MODULE || (existsSync(own) ? "../src/verticals.ts" : "../netlify/lib/verticals.js");
const { explainSector, detectModel } = await import(new URL(MODULE, import.meta.url));
const read = (...texts) => explainSector({ seller: texts }).vertical;
const words = (v) => JSON.stringify([v.vocabulary, v.buyerRoles, v.committee, v.objections, v.salesMotion, v.metrics, v.proofShape, v.discovery]).toLowerCase();

test("document AI: an AI-first document automation platform is AI native with document notes, not generic case notes", () => {
  const v = read("An AI-first end-to-end document automation platform that reads invoices, purchase orders and bills of lading, extracts and validates the data and writes it to the ERP");
  assert.equal(v && v.id, "ai-native");
  assert.equal(v.subtype, "document-ai");
  const t = words(v);
  assert.ok(/manual data entry/.test(t) && /document type/.test(t), t.slice(0, 200));
  assert.ok(!/cost per case|case review/.test(t));
  assert.equal(read("Intelligent document processing (IDP) for transactional documents").subtype, "document-ai");
});

test("AI video: an AI video and avatar platform is AI native with training video notes, never security or case notes", () => {
  const v = read("An AI video and avatar platform: create training videos with AI avatars and voiceovers in many languages from a document or slides");
  assert.equal(v && v.id, "ai-native");
  assert.equal(v.subtype, "ai-video");
  const t = words(v);
  assert.ok(/training video/.test(t) && /lms/.test(t), t.slice(0, 200));
  assert.ok(!/mean time to detect|cost per case|attack surface/.test(t));
});

test("engineering talent: engineers placed into client teams are ITeS services, not AI native software", () => {
  const v = read("The human layer behind production AI: it deploys AI-native engineers into client teams or as a fully managed team, and trains engineering workforces");
  assert.equal(v && v.id, "ites");
  assert.equal(v.subtype, "engineering-talent");
  const t = words(v);
  assert.ok(/vetted engineers/.test(t) && /dedicated team/.test(t), t.slice(0, 200));
  assert.ok(!/\bseats?\b|self serve|in-app|cost per case/.test(t));
  assert.equal(detectModel(undefined, "The human layer behind production AI: it deploys AI-native engineers into client teams or as a fully managed team").model, "services");
});

test("product management: a product management platform is SaaS with product team notes, not AI native or sales notes", () => {
  const v = read("An AI powered product management platform: one repository for customer feedback and insights, roadmaps, prioritization and specs");
  assert.equal(v && v.id, "saas");
  assert.equal(v.subtype, "product-management");
  const t = words(v);
  assert.ok(/roadmap/.test(t) && /product manager/.test(t), t.slice(0, 200));
  assert.ok(!/cost per case|quota|pipeline created|release frequency/.test(t));
});

test("digital adoption: a digital adoption platform has its own notes, not the product growth notes", () => {
  const v = read("A digital adoption platform that puts in-app guidance, walkthroughs and self help on enterprise applications such as ERP, CRM and HR systems");
  assert.equal(v && v.id, "saas");
  assert.equal(v.subtype, "digital-adoption");
  const t = words(v);
  assert.ok(/in-app guidance/.test(t) && /application rollout/.test(t), t.slice(0, 200));
  assert.ok(!/net revenue retention|accounts expanded|expansion revenue/.test(t));
  assert.equal(read("Product analytics and customer success software for SaaS companies").subtype, "product-growth");
});

test("penetration testing: pentesting as a service is its own kind, not the code scanning kind", () => {
  const v = read("Pentesting as a service: human-led pentests by vetted testers, autonomous pentests and DAST, with real time findings and retesting");
  assert.equal(v && v.id, "cybersecurity");
  assert.equal(v.subtype, "pentest");
  const t = words(v);
  assert.ok(/retest/.test(t) && /scope/.test(t), t.slice(0, 200));
  assert.ok(!/repositor|secrets in code|pull request|alert fatigue/.test(t));
});

test("attack surface and dynamic testing: an attack surface and DAST platform is its own kind, and a code scanner stays the code kind", () => {
  const v = read("An application security platform that combines continuous attack surface discovery of domains and subdomains with authenticated DAST and API scanning");
  assert.equal(v && v.id, "cybersecurity");
  assert.equal(v.subtype, "attack-surface-dast");
  const t = words(v);
  assert.ok(/internet facing assets/.test(t), t.slice(0, 200));
  assert.ok(!/repositor|secrets in code|pull request|software composition/.test(t));
  assert.equal(read("Static application security testing and software composition analysis that run in the developer pipeline").subtype, "appsec");
});

test("process orchestration: process orchestration software is software with process notes, also when only the agentic words come first", () => {
  const v = read("Process automation and orchestration software built on BPMN and DMN");
  assert.equal(v && v.id, "software");
  assert.equal(v.subtype, "process-orchestration");
  const t = words(v);
  assert.ok(/end to end process/.test(t) && /audit trail/.test(t), t.slice(0, 200));
  assert.ok(!/release frequency|lead time for changes|build time/.test(t));
  const w = read("An open platform for agentic orchestration that coordinates AI agents, people and systems across end-to-end business processes");
  assert.equal(w && w.id, "software");
  assert.equal(w.subtype, "process-orchestration");
});

test("open source support: free open source database software sold through support is software with support notes and a services model", () => {
  const text = "Open source database software with 24/7 expert support and services for MySQL, PostgreSQL and MongoDB, with no license fees and no lock-in";
  const v = read(text);
  assert.equal(v && v.id, "software");
  assert.equal(v.subtype, "open-source-support");
  const t = words(v);
  assert.ok(/support subscription/.test(t) && /uptime/.test(t), t.slice(0, 200));
  assert.ok(!/per seat|self serve trial|release frequency/.test(t));
  assert.equal(detectModel(undefined, text).model, "services");
});

test("IoT connectivity: an IoT SIM platform is telecom with device notes, never branch networking", () => {
  const v = read("A cloud-native IoT connectivity platform: IoT SIMs and eSIMs that businesses activate and control in a portal or API, on many mobile networks");
  assert.equal(v && v.id, "telecom");
  assert.equal(v.subtype, "iot-connectivity");
  const t = words(v);
  assert.ok(/devices in the field/.test(t) && /esim/.test(t), t.slice(0, 200));
  assert.ok(!/sd-wan|mpls|branch|leased line|site survey/.test(t));
  assert.equal(read("Global IoT connectivity platform and managed IoT connectivity provider").subtype, "iot-connectivity");
  assert.equal(detectModel(undefined, "IoT SIMs and eSIMs priced per SIM and data").model, "connectivity");
});

test("voice and messaging APIs: a carrier selling voice APIs and SIP trunking reads as the CPaaS kind, not as no kind", () => {
  const v = read("A cloud communications platform on an owned carrier network: programmable voice API, global SIP trunking, messaging APIs, phone numbers and emergency calling");
  assert.equal(v && v.id, "telecom");
  assert.equal(v.subtype, "cpaas-messaging");
  assert.equal(read("Cloud phone system and SIP trunking for small offices").subtype, "business-voice-ucaas");
});

test("trades software with an AI label: field service software for the trades is vertical SaaS with field service notes", () => {
  const v = read("AI operating system for services businesses (field service management software for trades such as roofing)", "An AI operating system for service businesses on one platform from first call to final payment: job and estimate management, scheduling and dispatch, invoicing and payments, plus AI agents");
  assert.equal(v && v.id, "vertical-saas");
  assert.equal(v.subtype, "field-services");
  const t = words(v);
  assert.ok(/technician/.test(t) && /work order/.test(t), t.slice(0, 200));
  assert.ok(!/head of data and ai|cost per case|evaluation set/.test(t));
  assert.equal(read("AI agents that review contracts and flag risky clauses").id, "ai-native");
});
