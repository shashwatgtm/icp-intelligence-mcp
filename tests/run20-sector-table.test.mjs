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
