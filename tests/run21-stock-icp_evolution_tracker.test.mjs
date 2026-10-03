// Run 21b step 2 (test first): icp_evolution_tracker printed every objection of the sector as a "loss reason to tag" in the sector file's order, and
// every sector measure in the same order, whatever wins, losses and market changes the user typed. The loss reasons and the measures are now led by
// the ones the user's own losses, wins and market changes point to (nothing is dropped, nothing is added).
// Companies are described in plain words (no names). Run: node --test tests/run21-stock-icp_evolution_tracker.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "icp_evolution_tracker", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const line = (t, label) => (t.split("\n").find((l) => l.includes(label)) || "");
const reasons = (t) => line(t, "Loss reasons to tag").split("): ")[1] || "";
const measures = (t) => line(t, "What this sector measures:");

const LASTMILE = { product_category: "Delivery management software that plans last mile routes and gives drivers a proof of delivery app", current_icp: "Online retailers that ship parcels to homes, with their own delivery fleet", recent_wins: "Online retailers with many failed first deliveries", recent_losses: "Lost to a rival whose driver app was easier for drivers to learn", market_changes: "More shoppers want a delivery time window" };
const FREIGHT = { product_category: "A freight marketplace that matches shippers with truckload carriers", current_icp: "Manufacturers that ship full truckloads on a few regular lanes", recent_wins: "Manufacturers that book many loads by phone each week", recent_losses: "Carriers on the platform missed pickups and the shipper lost trust", market_changes: "More shippers want spot rates for peak weeks" };
const EXPENSE = { product_category: "Spend management software with expense claims, approvals and corporate cards", current_icp: "Mid-size companies with a finance team of ten or more", recent_wins: "Companies with slow approvals of employee expenses", recent_losses: "Finance teams kept their ERP because migration would disrupt the close", market_changes: "New audit rules on expense evidence" };
const PAYAPI = { product_category: "Payments API for merchants: accept cards and bank transfers and pay out to sellers", current_icp: "Online platforms with a developer team", recent_wins: "Platforms where developers took weeks to go live with a first payment", recent_losses: "Lost to a provider with a longer uptime record", market_changes: "New instant bank transfer schemes" };

test("logistics: a last mile company and a freight marketplace each see their own loss reason and measure first, and neither gets the other's", async () => {
  const a = await call(LASTMILE), b = await call(FREIGHT);
  assert.match(reasons(a), /^drivers will not use a new app/i, reasons(a));
  assert.match(reasons(b), /^quality and reliability of carriers on the platform/i, reasons(b));
  assert.match(measures(a), /What this sector measures:\*\* first attempt delivery rate|What this sector measures:\*\* failed delivery and return rate/, measures(a));
  assert.match(measures(b), /What this sector measures:\*\* time to book a load/, measures(b));
  assert.doesNotMatch(a, /load fill rate|time to book a load|carrier acceptance|own carriers and rate contracts/i);
  assert.doesNotMatch(b, /first attempt|cost per delivery|drivers will not use|deliveries per vehicle/i);
});

test("fintech: a spend and expense company and a payments API company each see their own loss reason and measure first", async () => {
  const a = await call(EXPENSE), b = await call(PAYAPI);
  assert.match(reasons(a), /^migration will disrupt the close/i, reasons(a));
  assert.match(reasons(b), /^reliability and uptime/i, reasons(b));
  assert.match(measures(a), /What this sector measures:\*\* approval cycle time/, measures(a));
  assert.match(measures(b), /What this sector measures:\*\* time to first live payment/, measures(b));
  assert.doesNotMatch(a, /authorisation rate|chargeback|licensing and regulation|time to first live payment/i);
  assert.doesNotMatch(b, /days to close the books|policy breach|reconciliation effort|our erp already/i);
});

test("every objection and measure of the sector file is still listed, once, whatever the user typed (nothing dropped, nothing added)", async () => {
  const a = await call(LASTMILE), n = await call({ ...LASTMILE, recent_wins: "", recent_losses: "", market_changes: "" });
  const sorted = (s) => s.split(/; |, /).map((x) => x.replace(/\.$/, "").trim().toLowerCase()).sort();
  assert.deepEqual(sorted(reasons(a).replace(/\. Count each.*$/, "")), sorted(reasons(n).replace(/\. Count each.*$/, "")));
  assert.deepEqual(sorted(measures(a).split("measures:** ")[1]), sorted(measures(n).split("measures:** ")[1]));
});

test("no wins, losses or changes typed: the sector file's own order stands", async () => {
  const n = await call({ ...LASTMILE, recent_wins: "", recent_losses: "", market_changes: "" });
  assert.match(reasons(n), /^we already have a transport management system; drivers will not use a new app/i, reasons(n));
  assert.match(measures(n), /What this sector measures:\*\* cost per delivery, first attempt delivery rate/, measures(n));
});
