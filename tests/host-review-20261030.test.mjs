// Host review prep, 30 Oct 2026: three defects found by running the ICP review cases on the live server.
// (1) icp_scoring_model gave a negative value ("Not documented", "Absent") the full weight.
// (2) icp_scoring_model read a hypothesis and a "no evidence" note in success_correlation as a page claim and as a result.
// (3) icp_interview_synthesizer treated "Not measured" in value_realized as an outcome to lead with.
// Synthetic inputs only. Run: npm run build, then node --test tests/host-review-20261030.test.mjs
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
  return j.result.content.map((c) => c.text).join("\n");
};

const scoring = (criteria, success_correlation) => call("icp_scoring_model", { scoring_criteria: criteria, success_correlation, product_category: "CRM software", company: "Northwind" });

test("icp_scoring_model: a value that says the thing is missing scores 0, in either order", async () => {
  const t = await scoring([
    { criterion: "Repeated reconciliation pain", importance: "critical", values: ["Documented", "Not documented"] },
    { criterion: "Named process owner", importance: "important", values: ["Absent", "Present"] },
  ], "");
  assert.match(t, /Documented \(25 pts\) \/ Not documented \(0 pts\)/);
  assert.match(t, /Absent \(0 pts\) \/ Present \(15 pts\)/);
  assert.doesNotMatch(t, /Not documented \(25 pts\)|Absent \(15 pts\)/);
});

test("icp_scoring_model: a named list keeps full points for each target, and a negative value in it scores 0", async () => {
  const t = await scoring([{ criterion: "Industry", importance: "critical", values: ["Logistics", "Retail", "No clear industry"] }], "");
  assert.match(t, /Logistics \(25 pts\) \/ Retail \(25 pts\) \/ No clear industry \(0 pts\)/);
});

test("icp_scoring_model: a hypothesis and a no-evidence note are not read as a claim or a result", async () => {
  const t = await scoring([{ criterion: "Named process owner", importance: "important", values: ["Present", "Absent"] }],
    "Hypothesis only: named owners may improve adoption; no measured correlation supplied");
  assert.match(t, /"Hypothesis only: named owners may improve adoption": a hypothesis to test in your closed deals, not evidence yet/);
  assert.match(t, /"no measured correlation supplied": a note that no evidence is given yet, so it cannot score anything/);
  assert.doesNotMatch(t, /a page claim or recognition, not a closed-deal result|a result as you gave it/);
});

test("icp_scoring_model: a real result is still read as a result", async () => {
  const t = await scoring([{ criterion: "Named process owner", importance: "important", values: ["Present", "Absent"] }],
    "Deals with a named process owner closed 30% faster in the last two quarters");
  assert.match(t, /a result as you gave it/);
});

test("icp_interview_synthesizer: 'Not measured' is left out of the outcomes and named as missing", async () => {
  const t = await call("icp_interview_synthesizer", { interview_notes: [{ customer: "Northwind, synthetic interview scenario", role: "Revenue operations director",
    key_quotes: ["We reconcile pipeline records every Friday."], pain_points: ["Manual reconciliation"], buying_triggers: ["Reporting process review"], value_realized: ["Not measured"] }],
    product_category: "CRM software", company: "Contoso" });
  assert.match(t, /left out of the counts below: value_realized \("Not measured"\)/);
  assert.match(t, /- No outcomes captured as results\./);
  assert.match(t, /Collect customer outcomes before you lead with value in messaging/);
  assert.doesNotMatch(t, /\*\*Not measured\*\*|Seeks outcome: Not measured|Value messaging\*\*: "Not measured"/);
  assert.match(t, /\*\*Manual reconciliation\*\*: in the 1 interview/);
});
