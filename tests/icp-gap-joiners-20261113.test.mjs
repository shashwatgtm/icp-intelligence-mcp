import test from 'node:test';
import assert from 'node:assert/strict';
import {default as handler} from '../netlify/functions/mcp.mjs';

// 13 Nov 2026: ICP Gap Analysis took the job title out of "Mid-size companies with a
// finance controller and an ERP" and printed "with and an ERP". Every clause that stays
// must have all its words, and the buyer sentence takes "the" before a job title.
const call = async (args) => {
  const r = await handler(new Request('https://local.invalid/mcp', {method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'}, body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: {name: 'icp_gap_analysis', arguments: args}})}));
  const j = await r.json();
  return (j.result?.content || []).map(c => c.text).join('\n');
};
const M = {current_metrics: {avg_acv: 6000, avg_sales_cycle: 30, win_rate: 25, churn_rate: 18, nps: 28}, target_metrics: {avg_acv: 24000, avg_sales_cycle: 60, win_rate: 30, churn_rate: 8, nps: 45}};
const run = (current_customers, ideal_icp) => call({current_customers, ideal_icp, product_category: 'spend management software', ...M});
const DROPPED = /\b(?:with|having|and|or)\s+(?:and|or)\b|\bwith\s*[,”"]|\b(?:buyer is|buyers are) (?!the |a |an )\w/i;

test('exact: the public example keeps every word', async () => {
  const t = await run('Small companies under 200 employees, founder-run finance', 'Mid-size companies with a finance controller and an ERP');
  assert.doesNotMatch(t, DROPPED);
  assert.match(t, /“Mid-size companies with an ERP”/);
  assert.match(t, /Your ideal buyer is the finance controller;/);
});

test('same meaning: the title in other places of the list', async () => {
  for (const [ideal, keep] of [
    ['Mid-size companies with an ERP and a finance controller', '“Mid-size companies with an ERP”'],
    ['Mid-size manufacturers with a finance controller, an ERP and 50+ field reps', '“Mid-size manufacturers with an ERP and 50+ field reps”'],
    ['Series B SaaS companies with a CFO and a NetSuite instance', null],
  ]) {
    const t = await run('Founder-led D2C brands', ideal);
    assert.doesNotMatch(t, DROPPED, ideal);
    if (keep) assert.ok(t.includes(keep), ideal + '\n' + t.slice(0, 900));
  }
  const two = await run('Small logistics firms', 'Mid-size 3PLs with an operations manager and a finance controller');
  assert.match(two, /Your ideal buyers are the operations manager and the finance controller;/);
  assert.doesNotMatch(two, DROPPED);
  const only = await run('Small agencies', 'Mid-size companies with a finance controller');
  assert.doesNotMatch(only, DROPPED);
  assert.doesNotMatch(only, /companies with[”"]/);
});

test('opposite: no title or a buyer clause leaves the description as written', async () => {
  const none = await run('Small companies under 200 employees', 'Mid-size companies with an ERP and a shared services team');
  assert.doesNotMatch(none, DROPPED);
  assert.doesNotMatch(none, /ideal buyers? (?:is|are)/);
  const clause = await run('Small companies under 200 employees', 'Mid-size companies with an ERP, with the finance controller as the buyer');
  assert.match(clause, /Your ideal buyer is the finance controller;/);
  assert.match(clause, /“Mid-size companies with an ERP”/);
});
