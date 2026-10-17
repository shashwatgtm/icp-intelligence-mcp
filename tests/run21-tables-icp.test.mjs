// Run 21b late task: the buyer group roles (the SEATS table of buyer_group_analyzer, keyed by the vertical id) were written for ONE kind of company
// per vertical and were printed for every company of that vertical (a freight visibility company got "Head of Last-Mile Operations" and "Fleet
// Manager", a payments API company got "Head of Accounts Payable", a construction platform got "Head of Distribution", a messaging company got
// "Network Manager", an email security company got "Cloud Security Lead"). The stock roles are now used only when the sector read names the kind they
// were written for (v.subtype); every other company of the vertical gets neutral roles. Companies are described in plain words (no names).
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "buyer_group_analyzer", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const roles = (t) => t.split("\n").filter((l) => l.startsWith("**Role**")).join("\n");
const group = async (product_category) => roles(await call({ product_category }));

const LASTMILE = "Last mile delivery management software with route planning and proof of delivery";
const FREIGHT = "Freight visibility platform that tracks shipments in real time across carriers";
const EXPENSE = "Spend management software with expense claims, approvals and corporate cards";
const PAYAPI = "Payments API for merchants to accept cards and bank transfers";
const FMCG = "Field sales automation and distributor management software for consumer brands, with beat planning and order capture in the outlet";
const CONSTRUCTION = "Construction management software for general contractors: project management, cost management and quality and safety";
const OPERATOR = "Enterprise connectivity and SD-WAN provider that links business sites";
const MESSAGING = "Messaging platform and SMS API that lets businesses message their customers";
const CLOUDSEC = "Cloud security platform that finds misconfigurations and exposures in cloud accounts";
const EMAILSEC = "Email security gateway that blocks phishing and impersonation";
const DEVPLATFORM = "Developer platform with CI pipelines and internal tooling for engineering teams";
const TESTING = "API testing and QA automation tool for engineering teams";

test("logistics: last mile keeps its roles, a freight visibility company gets neutral roles", async () => {
  const a = await group(LASTMILE), b = await group(FREIGHT);
  assert.match(a, /Head of Last-Mile Operations/);
  assert.match(a, /Fleet Manager/);
  assert.doesNotMatch(b, /Last-Mile|Fleet Manager|cost per delivery/i);
  assert.match(b, /^\*\*Role\*\*: Head of Logistics Operations/);
});

test("fintech: spend and expense keeps its roles, a payments API company gets neutral roles", async () => {
  const a = await group(EXPENSE), b = await group(PAYAPI);
  assert.match(a, /Finance Controller/);
  assert.match(a, /Head of Accounts Payable/);
  assert.doesNotMatch(b, /Finance Controller|Accounts Payable|Internal Audit/i);
});

test("vertical SaaS: retail execution keeps its roles, a construction platform gets neutral roles", async () => {
  const a = await group(FMCG), b = await group(CONSTRUCTION);
  assert.match(a, /National Sales Head/);
  assert.match(a, /Head of Distribution/);
  assert.doesNotMatch(b, /National Sales Head|Regional Sales Manager|Head of Distribution|Sales Operations/i);
});

test("telecom: operators and enterprise connectivity keep their roles, a messaging company gets neutral roles", async () => {
  const a = await group(OPERATOR), b = await group(MESSAGING);
  assert.match(a, /Head of IT Infrastructure/);
  assert.match(a, /Network Manager/);
  assert.doesNotMatch(b, /IT Infrastructure|Network Manager/i);
});

test("cybersecurity: cloud security keeps its roles, an email security company gets neutral roles", async () => {
  const a = await group(CLOUDSEC), b = await group(EMAILSEC);
  assert.match(a, /Cloud Security Lead/);
  assert.match(a, /Head of Security Operations/);
  assert.doesNotMatch(b, /Cloud Security Lead|Head of Security Operations/i);
});

test("software: a developer platform keeps its roles, a testing tool gets neutral roles", async () => {
  const a = await group(DEVPLATFORM), b = await group(TESTING);
  assert.match(a, /Platform Engineering Lead/);
  assert.doesNotMatch(b, /Platform Engineering Lead|^\*\*Role\*\*: Developers/im);
});

test("a company whose kind is not named gets the neutral roles, never the stock ones", async () => {
  const t = await group("Logistics software for operations teams");
  assert.doesNotMatch(t, /Last-Mile|Fleet Manager/i);
});

test("the neutral roles carry no figure and no dash", async () => {
  for (const p of [FREIGHT, PAYAPI, CONSTRUCTION, MESSAGING, EMAILSEC, TESTING]) assert.doesNotMatch(await group(p), /\d|[–—]/);
});
