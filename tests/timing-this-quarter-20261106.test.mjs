// Owner decision 6 Nov 2026: "this quarter" reads as soon (70 points) in account_prioritization timing.
// Negated or conflicting phrases stay unknown (50). "this week" and "this month" keep their reading; "next quarter" reads as later (40).
import test from 'node:test';
import assert from 'node:assert/strict';
const { default: handler } = await import(new URL('../netlify/functions/mcp.mjs', import.meta.url));
let id = 0;
const call = async (timing) => (await (await handler(new Request('https://local.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'account_prioritization', arguments: { accounts: [{ name: 'Account One', fit_score: 80, intent_signals: 70, relationship: 60, timing }] } } }) }))).json()).result;
const points = async (timing) => { const r = await call(timing); assert.ok(!r.isError, JSON.stringify(r).slice(0, 300)); return r.structuredContent.result.accounts[0].scores.timing; };
for (const phrase of ['this quarter', 'within this quarter', 'in this quarter', 'by the end of this quarter', 'by end of quarter', 'We expect to buy within this quarter'])
  test(`"${phrase}" reads as soon, 70 points`, async () => assert.equal(await points(phrase), 70));
test('the output line says 70 points for "within this quarter"', async () => assert.match((await call('within this quarter')).content[0].text, /\| within this quarter \(70 pts\) \|/));
for (const phrase of ['not this quarter', 'unknown', 'this quarter and next quarter', 'not within this quarter'])
  test(`"${phrase}" stays unknown, no timing points earned`, async () => assert.equal(await points(phrase), null));
test('this week, this month and next quarter keep their reading', async () => {
  assert.equal(await points('this week'), 100);
  assert.equal(await points('this month'), null);
  assert.equal(await points('next quarter'), 40);
});
