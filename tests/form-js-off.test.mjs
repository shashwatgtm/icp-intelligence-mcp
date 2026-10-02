// Run 15 D39 (owner decision, 30 September 2026; run 14 audit C1): the ICP forms work with JavaScript off. A "one per line" rows box
// sent as plain form text is turned into the list exactly as the browser's rows() in public/assets/app.js (work/hosted/app-icp.js) does, and the
// weight boxes named "prioritization_weights.fit" and so on fill that object as the browser's collect() does. So the same box
// text gives the same answer with JavaScript off (a form post) and on (the JSON the browser builds). A JSON value still works.
// The browser side is the real rows() source, read from public/assets/app.js. Tested in-process: netlify/functions/api.mjs.
// Run: node --test tests/form-js-off.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { default: api } = await import(new URL("../netlify/functions/api.mjs", import.meta.url));
const src = readFileSync(new URL("../public/assets/app.js", import.meta.url), "utf8");
const grab = (name) => { const i = src.indexOf(`function ${name}(`); let d = 0, j = src.indexOf("{", i); for (; j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}" && --d === 0) break; } return src.slice(i, j + 1); };
const browserRows = new Function(`${grab("words")}\n${grab("rows")}\nreturn rows;`)();
const specOf = (page, name) => {
  const html = readFileSync(new URL(`../public/tools/${page}/index.html`, import.meta.url), "utf8");
  const m = html.match(new RegExp(`name="${name}"[^>]*data-rows="([^"]+)"`));
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
};
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const ctx = (tool) => ({ params: { tool } });
const formPost = async (tool, fields) => {
  const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${tool}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields).toString() }), ctx(tool));
  const html = await r.text();
  const m = html.match(/<pre class="hx-result-text">([\s\S]*?)<\/pre>/);
  return { status: r.status, text: m ? unesc(m[1]) : null, html };
};
const jsonPost = async (tool, input) => {
  const r = await api(new Request(`https://x.gtmhelix.com/api/tools/${tool}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input }) }), ctx(tool));
  return { status: r.status, body: await r.json() };
};

const CASES = [
  ["account_prioritization", "account-prioritization", "accounts", "Example Manufacturing Co, 80, 60, 40, soon\nExample IT Services Co, 55, 70, 20, now\n\nExample Logistics Co, 30, 20, 10, later"],
  ["icp_scoring_model", "icp-scoring-model", "scoring_criteria", "Number of locations, critical, 5 or more, 2 to 4, 1\nBudget owner, important, COO, Practice manager"],
  ["icp_interview_synthesizer", "icp-interview-synthesizer", "interview_notes", "Example Manufacturing Co | Finance Controller | slow month-end close; manual reconciliation | new CFO hire | close 5 days faster | We spent a week a month matching card spends\nExample IT Services Co | Head of Accounts Payable | late expense claims | audit finding | fewer policy breaches | Receipts finally arrive on time"],
  ["icp_deep_dive", "icp-deep-dive", "customers", "Example Manufacturing Co, Manufacturing, 300 to 1000 employees, 12000, Finance Controller, 45, new CFO hire, Google Calendar, Stripe\nExample IT Services Co, IT services, 1000 plus, 18000, COO"],
];

for (const [tool, page, field, text] of CASES) {
  test(`D39: ${tool}: the same ${field} box gives the same answer with JavaScript off and on`, async () => {
    const problems = [];
    const list = browserRows(text, specOf(page, field), problems);
    assert.deepEqual(problems, []);
    const on = await jsonPost(tool, { [field]: list });
    assert.equal(on.status, 200, JSON.stringify(on.body).slice(0, 300));
    const off = await formPost(tool, { [field]: text });
    assert.equal(off.status, 200, off.html.slice(0, 400));
    assert.equal(off.text, on.body.text);
  });
}

test("D39: a JSON value in the box still works as today", async () => {
  const off = await formPost("account_prioritization", { accounts: '[{"name":"Example Manufacturing Co","fit_score":80,"intent_signals":60,"relationship":40,"timing":"soon"}]' });
  const on = await jsonPost("account_prioritization", { accounts: [{ name: "Example Manufacturing Co", fit_score: 80, intent_signals: 60, relationship: 40, timing: "soon" }] });
  assert.equal(off.status, 200);
  assert.equal(off.text, on.body.text);
});

test("D39: a wrong line gets the browser's own message", async () => {
  const problems = [];
  browserRows("Example Manufacturing Co, 80, 60", specOf("account-prioritization", "accounts"), problems);
  const off = await formPost("account_prioritization", { accounts: "Example Manufacturing Co, 80, 60" });
  assert.equal(off.status, 400);
  for (const p of problems) assert.ok(off.html.includes(p.replace(/&/g, "&amp;")), p);
});

test("D39: the weight boxes fill prioritization_weights with JavaScript off, as the browser does", async () => {
  const text = "Example Manufacturing Co, 80, 60, 40, soon\nExample IT Services Co, 55, 70, 20, now";
  const list = browserRows(text, specOf("account-prioritization", "accounts"), []);
  const on = await jsonPost("account_prioritization", { accounts: list, prioritization_weights: { fit: 50, intent: 20, relationship: 20, timing: 10 } });
  const off = await formPost("account_prioritization", { accounts: text, "prioritization_weights.fit": "50", "prioritization_weights.intent": "20", "prioritization_weights.relationship": "20", "prioritization_weights.timing": "10" });
  assert.equal(off.status, 200, off.html.slice(0, 400));
  assert.equal(off.text, on.body.text);
  assert.match(off.text, /\| \*\*Fit\*\* \| 50% \|/);
});
