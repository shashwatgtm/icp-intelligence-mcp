// Run 21c job 3 (test first): icp_evolution_tracker was called a skeleton by the run 21b judges: after the part by part read it printed a generic
// framework (checklist, decision matrix with Yes and No cells, a tracking table with "(to fill in)", preset thresholds). It now ends with a draft ICP for the
// next period built from the user's own ICP parts, wins, losses and market changes, and a CRM pull list built from the user's own segments. Segments
// are cleaned: a word such as "from" or "plus banks" that came from the sentence around the list is not a segment. Companies in plain words (no names).
// Run: node --test tests/run21c-draft-icp_evolution_tracker.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "icp_evolution_tracker", arguments: args } }) }));
  const j = await r.json();
  assert.ok(!j.result.isError);
  return j.result.content.map((c) => c.text).join("\n");
};
const BUILD = {
  company: "Alder Works", product_category: "construction management software for general contractors", time_period: "Q4 2026",
  current_icp: "General contractors with 50 to 500 employees; segments: commercial builders, civil and infrastructure contractors, specialty trade contractors; from small firms to national builders, plus owners and developers; the CFO signs and the project executive champions it; problem: change orders and RFIs tracked in spreadsheets",
  recent_wins: "Two civil contractors that moved all subcontractor payments into one tool; a commercial builder that replaced spreadsheets for change orders",
  recent_losses: "A specialty contractor chose its accounting vendor's module; a builder said the price was too high for a team of ten",
  market_changes: "Owners now ask for digital closeout packages on every project",
};
const MSG = {
  company: "Pingly Messaging", product_category: "business messaging platform: SMS and WhatsApp business API for banks and retailers", time_period: "Q4 2026",
  current_icp: "Banks and retailers that send alerts and one time passwords; segments: retail banks, online retailers, logistics companies that send delivery updates; the head of digital signs and developers integrate the API; problem: messages reach the phone late or not at all",
  recent_wins: "A retail bank that moved its one time passwords to the API; an online retailer that wanted delivery receipts per message",
  recent_losses: "A logistics company stayed with its telecom operator because of one contract for everything",
  market_changes: "Banks are asked to show delivery reports for every alert they send",
};

test("the answer ends with a draft ICP for the period, built from the user's own parts, wins, losses and changes", async () => {
  const t = await call(BUILD);
  assert.match(t, /## Draft ICP for Q4 2026/);
  const draft = t.slice(t.indexOf("## Draft ICP for Q4 2026"));
  for (const w of ["commercial builders", "civil and infrastructure contractors", "specialty trade contractors", "CFO", "project executive", "change orders and RFIs tracked in spreadsheets", "civil contractors that moved all subcontractor payments", "digital closeout packages"]) assert.ok(draft.includes(w), `draft lacks "${w}"`);
});

test("no generic framework left: no decision matrix of Yes and No cells, no '(to fill in)', no preset threshold table", async () => {
  const t = await call(BUILD);
  assert.doesNotMatch(t, /\(to fill in\)|Decision Matrix|\| Winning in new segments \||>10% decline|>20% longer|Example figures: replace with your own/);
  assert.doesNotMatch(t, /Should improve if ICP is right|Best-fit should/);
});

test("words from the sentence around the list are not segments", async () => {
  const t = await call(BUILD);
  assert.doesNotMatch(t, /\*\*Segment (?:from|plus)\b/i);
});

test("two different companies get drafts that differ line by line", async () => {
  const a = (await call(BUILD)).split("\n").filter((l) => l.length >= 30);
  const b = (await call(MSG)).split("\n").filter((l) => l.length >= 30);
  const shared = a.filter((l) => b.includes(l)).length;
  const da = (await call(BUILD)), db = (await call(MSG));
  const tail = (t) => t.slice(t.indexOf("## Draft ICP")).split("\n").filter((l) => l.length >= 30 && !/^\*Built only|^\*\*Next Step\*\*/.test(l));
  const sa = tail(da), sb = tail(db);
  assert.ok(sa.length >= 4 && sb.length >= 4);
  assert.ok(sa.filter((l) => sb.includes(l)).length / sa.length < 0.25, "draft lines shared");
  assert.ok(shared / a.length < 0.6);
});

test("with no wins, losses or changes the draft still reads, says what is missing once, and has no placeholder", async () => {
  const t = await call({ current_icp: BUILD.current_icp, company: "Alder Works", time_period: "Q4 2026" });
  assert.match(t, /## Draft ICP for Q4 2026/);
  assert.doesNotMatch(t, /\[[^\]]*\]|\{[^}]*\}|\(to fill in\)|TBD/);
  assert.equal((t.match(/add recent_wins/g) || []).length, 1);
});

test("no long or short dashes in the answer", async () => {
  const t = await call(BUILD);
  assert.doesNotMatch(t, new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"));
});
