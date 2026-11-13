import test from 'node:test';
import assert from 'node:assert/strict';
import {classifySoftwareQuestion, SOFTWARE_REFERRAL, SOFTWARE_OUTSIDE_SCOPE} from '../dist/software-policy.js';
const {default: handler} = await import('../netlify/functions/mcp.mjs');

// Red team round 1, 14 Nov 2026, finding 1: buyers type in the search style,
// without a question mark. The owner's own test sentences, word for word without
// "?", must behave exactly as the "?" versions do: GTM stack software goes to the
// 45 minute booking, non-GTM tech gets the plain decline. Exact, same-meaning and
// opposite sentences across the nine verticals.
const verticals = ['logistics tech','fintech','vertical SaaS','AI native','ITeS','telecom','cybersecurity','software','SaaS'];
const OWNER = [
  ['best marketing analytics tool', 'gtm'],
  ['best data warehouse for us', 'outside'],
  ['top CRM for us', 'gtm'],
  ['recommended outbound software', 'gtm'],
];

test('the four owner sentences without a question mark, word for word, and with "?"', () => {
  for (const [q, expected] of OWNER) {
    assert.equal(classifySoftwareQuestion({notes: q}), expected, q);
    assert.equal(classifySoftwareQuestion({notes: q + '?'}), expected, q + '?');
    assert.equal(classifySoftwareQuestion({notes: q[0].toUpperCase() + q.slice(1) + '.'}), expected, q + '.');
  }
});

test('same meaning without "?", in every vertical', () => {
  for (const v of verticals) {
    for (const q of [
      `best marketing analytics tool for our ${v} company`,
      `top CRM for our ${v} startup`,
      `recommended outbound software for our ${v} business`,
      `Best sales engagement platform for our ${v} team`,
      `top marketing automation software for our ${v} company`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'gtm', q);
    for (const q of [
      `best data warehouse for our ${v} company`,
      `top SIEM for our ${v} startup`,
      `recommended payment gateway for our ${v} business`,
      `best BI tool for our ${v} company`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'outside', q);
  }
});

test('opposite: statements and product descriptions without "?" stay evidence, in every vertical', () => {
  for (const v of verticals) {
    for (const q of [
      `Top route planning software for ${v} shippers.`,
      `We are the best marketing analytics tool for ${v} teams.`,
      `Our product is the top CRM for ${v} firms.`,
      `We chose the best CRM for us last year, as a ${v} company.`,
      `best channel for our ${v} analytics product`,
      `Recommended outbound plan for our ${v} analytics software`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'none', q);
  }
});

const call = async (name, args) => {
  const r = await handler(new Request('https://local.invalid/mcp', {method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'}, body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: {name, arguments: args}})}));
  const j = await r.json();
  return (j.result?.content || []).map(c => c.text).join('\n');
};
const TOOLS = [
  ['icp_gap_analysis', q => ({current_customers: 'Small companies under 200 employees, founder-run finance', ideal_icp: 'Mid-size companies with a finance controller and an ERP', product_category: 'spend management software', context: q})],
];

test('through the MCP handler: the four owner sentences without "?" get the booking or the plain decline', async () => {
  for (const [name, args] of TOOLS) for (const [q, expected] of OWNER) {
    assert.equal(await call(name, args(q)), expected === 'gtm' ? SOFTWARE_REFERRAL : SOFTWARE_OUTSIDE_SCOPE, name + ': ' + q);
  }
});
