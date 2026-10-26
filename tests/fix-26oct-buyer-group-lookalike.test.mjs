// 26 Oct 2026: two output defects found in live runs (guides-b2-rebuild TOOL-QUIRKS-FOUND-26OCT.md).
// (1) buyer_group_analyzer listed "Head of IT" as "not in your list" when the user had named it.
// (2) lookalike_signal_generator printed the checklist and subscriptions of every platform when platforms named one.
// Every figure is hypothetical. Run: node --test tests/fix-26oct-buyer-group-lookalike.test.mjs
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
const NOT_IN_LIST = /\*\*Usual in [^\n]*, not in your list\*\*: ([^\n]*)/;
const spend = (stakeholders) => call("buyer_group_analyzer", { product_category: "spend management software", deal_size: "$24,000 ACV",
  target_company_size: "300-3000 employees", typical_champion: "Finance Controller", known_stakeholders: stakeholders });

// ---- (1) buyer_group_analyzer ----
test("buyer group: a Head of IT the user named is never 'not in your list' (the reported case)", async () => {
  const r = await spend(["CFO", "Head of IT", "Head of Accounts Payable"]);
  assert.equal(r.isError, false);
  assert.match(r.text, /\*\*Role\*\*: Head of IT\n/);
  assert.doesNotMatch(r.text, /not in your list\*\*: [^\n]*Head of IT/);
});

test("buyer group: titles match case-insensitively, and IT Head or IT Director count as the Head of IT", async () => {
  for (const it of ["head of it", "HEAD OF IT", "IT Head", "IT Director", "Director of IT"]) {
    const r = await spend(["CFO", it, "Head of Accounts Payable"]);
    assert.equal(r.isError, false);
    assert.doesNotMatch(r.text, /not in your list\*\*: [^\n]*Head of IT/, it);
  }
});

test("buyer group: a sector role the user did not name is still listed", async () => {
  const r = await spend(["CFO", "Data Engineer", "Head of Accounts Payable"]);
  assert.equal(r.isError, false);
  assert.match(r.text, NOT_IN_LIST);
  assert.match(NOT_IN_LIST.exec(r.text)[1], /^Head of IT \(technical evaluation\)\. Ask your champion whether they are involved\.$/);
});

test("buyer group: a champion named as a stakeholder's seat role is not listed again", async () => {
  // the champion typed is the sector's economic buyer; the seat is filled by another budget owner
  const r = await call("buyer_group_analyzer", { product_category: "spend management software", typical_champion: "CFO", known_stakeholders: ["CEO", "Head of IT"] });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /not in your list\*\*: [^\n]*Chief Financial Officer/);
  assert.doesNotMatch(r.text, /not in your list\*\*: [^\n]*Head of IT/);
});

test("buyer group: a different role in another seat does not hide a sector role (VP Engineering is not the Engineering Manager)", async () => {
  const r = await call("buyer_group_analyzer", { product_category: "API testing", deal_size: "$6,300-$11,700", target_company_size: "500-5000 employees",
    typical_champion: "QA Lead", known_stakeholders: ["VP Engineering", "QA Lead", "Platform Engineering Lead", "Security Engineer", "Developers"] });
  assert.equal(r.isError, false);
  assert.match(r.text, /not in your list\*\*: [^\n]*Engineering Manager \(technical evaluation\)/);
});

test("buyer group: an operations manager does not hide the Chief Operating Officer", async () => {
  const r = await call("buyer_group_analyzer", { company: "Parcelora", product_category: "ecommerce shipping platform for online sellers",
    typical_champion: "Manager, Operations", known_stakeholders: ["Founder", "Manager, Operations"] });
  assert.equal(r.isError, false);
  assert.match(r.text, /not in your list\*\*: [^\n]*Chief Operating Officer \(budget or sign-off\)/);
});

test("buyer group: an acronym, a plural or a CIO in investment management counts as the sector role typed", async () => {
  const tel = await call("buyer_group_analyzer", { product_category: "enterprise connectivity and SD-WAN for branch sites", typical_champion: "Network Manager",
    known_stakeholders: ["Head of IT Infrastructure", "Network Manager", "CISO", "Procurement Head"] });
  assert.equal(tel.isError, false);
  assert.doesNotMatch(tel.text, /not in your list\*\*: [^\n]*(?:CISO|Network Manager)/);
  const inv = await call("buyer_group_analyzer", { product_category: "AI research assistant for investment management firms", typical_champion: "portfolio manager",
    known_stakeholders: ["CIO", "portfolio manager", "risk teams"] });
  assert.equal(inv.isError, false);
  assert.doesNotMatch(inv.text, /not in your list\*\*: [^\n]*Chief Investment Officer/);
});

// ---- (2) lookalike_signal_generator ----
const ll = (extra) => call("lookalike_signal_generator", { champion_titles: ["Finance Controller"], product_category: "spend management software", ...extra });
const CHECKLIST_ALL = `## Implementation Checklist

### LinkedIn Sales Navigator
- [ ] Build and save company search
- [ ] Build and save lead search
- [ ] Enable weekly alert emails
- [ ] Export first batch (25 leads) (Example figure: replace with your own)
- [ ] Add to outreach sequence

### Google Ads
- [ ] Create custom intent audience
- [ ] Create competitor website audience
- [ ] Set up retargeting pixel
- [ ] Launch awareness campaign

### Intent Data (6sense/Bombora)
- [ ] Configure account fit model
- [ ] Set up intent topic tracking
- [ ] Create daily alert for surging accounts
- [ ] Integrate with CRM

### Contact Database
- [ ] Run search with criteria
- [ ] Verify data quality (10% sample) (Example figure: replace with your own)
- [ ] Export qualified contacts
- [ ] Enrich with additional data

---

## Important Notes

**This tool generates targeting CRITERIA, not actual data.**

To execute these searches, you need:
1. **LinkedIn Sales Navigator** subscription
2. **Google Ads** account with budget
3. **6sense/Bombora** intent data subscription (optional)
4. **ZoomInfo/Apollo** contact database subscription

`;

test("lookalike: platforms linkedin shows only the LinkedIn checklist and subscription", async () => {
  const r = await ll({ platforms: ["linkedin"] });
  assert.equal(r.isError, false);
  assert.match(r.text, /## Implementation Checklist\n\n### LinkedIn Sales Navigator\n/);
  assert.doesNotMatch(r.text, /### Google Ads|### Intent Data|### Contact Database/);
  assert.match(r.text, /To execute these searches, you need:\n1\. \*\*LinkedIn Sales Navigator\*\* subscription\n\n/);
  assert.doesNotMatch(r.text, /Google Ads\*\* account|6sense\/Bombora\*\* intent|ZoomInfo\/Apollo\*\* contact/);
});

test("lookalike: two platforms show their two checklists and subscriptions, numbered from 1", async () => {
  const r = await ll({ platforms: ["google_ads", "apollo"] });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /### LinkedIn Sales Navigator|### Intent Data/);
  assert.match(r.text, /### Google Ads\n- \[ \] Create custom intent audience/);
  assert.match(r.text, /### Contact Database\n- \[ \] Run search with criteria/);
  assert.match(r.text, /you need:\n1\. \*\*Google Ads\*\* account with budget\n2\. \*\*ZoomInfo\/Apollo\*\* contact database subscription\n\n/);
});

test("lookalike: platforms left out or empty keeps the full checklist and every subscription, as before", async () => {
  for (const extra of [{}, { platforms: [] }]) {
    const r = await ll(extra);
    assert.equal(r.isError, false);
    assert.ok(r.text.includes(CHECKLIST_ALL), JSON.stringify(extra));
  }
});
