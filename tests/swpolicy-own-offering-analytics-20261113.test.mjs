import test from 'node:test';
import assert from 'node:assert/strict';
import {classifySoftwareQuestion, SOFTWARE_REFERRAL, SOFTWARE_OUTSIDE_SCOPE} from '../src/software-policy.ts';
import {default as handler} from '../netlify/functions/mcp.mjs';

// 13 Nov 2026, ported from GTM Alpha (de2915e and the analytics routing rule):
// 1. A GTM question about the user's OWN software or analytics product is answered
//    ("Choose between partner-led and outbound for a telecom analytics product").
// 2. Owner decision: a plain "best analytics tool for us?" and marketing, sales,
//    demand generation or customer success analytics tool questions go to the
//    45 minute booking. Data warehouse, SIEM, BI and other non-GTM tech keep the
//    plain decline. Exact, same-meaning and opposite sentences, nine verticals.
const verticals = ['logistics tech','fintech','vertical SaaS','AI native','ITeS','telecom','cybersecurity','software','SaaS'];

test('own offering described as software or analytics is a GTM question, in every vertical', () => {
  for (const v of verticals) for (const q of [
    `Choose between partner-led and outbound for a ${v} analytics product.`,
    `Which route should we take for our ${v} analytics software: partners or outbound sales?`,
    `We are not asking which software to buy; choose partner-led or outbound for our ${v} analytics product.`,
    `Compare PLG and sales-led for our ${v} developer tools startup.`,
  ]) assert.equal(classifySoftwareQuestion({notes: q}), 'none', q);
  for (const q of [
    'Which channel should we lead with for our AI analytics product sold to banks?',
    'Choose a pricing model for our cybersecurity software sold to mid-size banks.',
    'Which segment should we target first with our analytics platform: retail banks or insurers?',
    'What is the best go-to-market for analytics software sold to telcos?',
    'Pick inbound or outbound for our AI app that helps ITeS firms run service desks.',
    'Which is better for a cloud security platform: channel partners or direct sales?',
  ]) assert.equal(classifySoftwareQuestion({notes: q}), 'none', q);
});

test('choosing software for the user to buy is still referred or declined, in every vertical', () => {
  for (const v of verticals) {
    for (const q of [
      `Choose between two CRM platforms for our ${v} analytics product.`,
      `Which CRM should we buy for our ${v} analytics product?`,
      `HubSpot or Salesforce for our ${v} startup?`,
      `For our ${v} product, recommend a sales engagement tool.`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'gtm', q);
    for (const q of [
      `Which data warehouse should we buy for our ${v} analytics product?`,
      `Should we choose Snowflake or BigQuery for our ${v} analytics platform?`,
      `Choose between Datadog and New Relic for our ${v} SaaS platform.`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'outside', q);
  }
  assert.equal(classifySoftwareQuestion({notes: 'Should we use Segment or mParticle?'}), 'outside');
  assert.equal(classifySoftwareQuestion({notes: 'Recommend a tool for our analytics product.'}), 'outside');
});

test('analytics routing: exact, same meaning and opposite, in every vertical', () => {
  assert.equal(classifySoftwareQuestion({notes: 'What is the best analytics tool for us?'}), 'gtm');
  for (const v of verticals) {
    assert.equal(classifySoftwareQuestion({notes: `What is the best analytics tool for us? We are a ${v} company.`}), 'gtm', v);
    for (const q of [
      `Which analytics platform would you recommend for our ${v} business?`,
      `Which demand generation analytics tool should our ${v} marketing team buy?`,
      `Recommend a customer success analytics platform for our ${v} CS team.`,
      `What is the best sales analytics software for a ${v} sales team?`,
      `Which marketing analytics tool fits our ${v} startup?`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'gtm', q);
    for (const q of [
      `What is the best data warehouse for our ${v} company?`,
      `Which SIEM or security analytics tool should our ${v} SOC team buy?`,
      `Which BI tool should our ${v} finance team use?`,
      `What is the best product analytics tool for our ${v} startup?`,
      `Which data warehouse should our ${v} team use for marketing analytics?`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'outside', q);
    for (const q of [
      `Which channel should we lead with for our ${v} customer success analytics platform?`,
      `Choose between partner-led and outbound for our ${v} marketing analytics software.`,
    ]) assert.equal(classifySoftwareQuestion({notes: q}), 'none', q);
  }
});

const call = async (name, args) => {
  const r = await handler(new Request('https://local.invalid/mcp', {method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'}, body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: {name, arguments: args}})}));
  const j = await r.json();
  return (j.result?.content || []).map(c => c.text).join('\n');
};
const TOOLS = [
  ['icp_evolution_tracker', q => ({current_icp: 'Mid-size manufacturers with field sales teams', recent_wins: 'IT services firms with heavy travel spend', recent_losses: 'Large enterprises wanting an ERP-only expense module', time_period: 'last quarter', market_changes: q})],
  ['tam_sam_som_calculator', q => ({total_potential_companies: 9000, average_contract_value: 24000, segment_name: 'Indian mid-size companies with an ERP', data_sources: q})],
  ['icp_gap_analysis', q => ({current_customers: 'Small companies under 200 employees, founder-run finance', ideal_icp: 'Mid-size companies with a finance controller and an ERP', product_category: 'spend management software', context: q})],
];

test('through the MCP handler: own product answered, plain analytics booked, data warehouse declined', async () => {
  for (const [name, args] of TOOLS) {
    const own = await call(name, args('Choose between partner-led and outbound for a telecom analytics product.'));
    // A full answer (some ICP answers quote the booking line inside a checklist), never the booking or decline alone.
    assert.ok(!own.includes(SOFTWARE_OUTSIDE_SCOPE) && !own.startsWith(SOFTWARE_REFERRAL) && own.length > 400, name + ': ' + own.slice(0, 160));
    assert.equal(await call(name, args('What is the best analytics tool for us?')), SOFTWARE_REFERRAL, name);
    assert.equal(await call(name, args('Which customer success analytics tool should we buy?')), SOFTWARE_REFERRAL, name);
    assert.equal(await call(name, args('Which CRM should we buy for our telecom analytics product?')), SOFTWARE_REFERRAL, name);
    assert.equal(await call(name, args('What is the best data warehouse for our telecom company?')), SOFTWARE_OUTSIDE_SCOPE, name);
    assert.equal(await call(name, args('Recommend a SIEM for our cybersecurity team.')), SOFTWARE_OUTSIDE_SCOPE, name);
  }
});
