import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const alpha = existsSync(new URL('../netlify/functions/mcp-sse.js', import.meta.url));
const {asksForSoftware, SOFTWARE_REFERRAL} = await import(alpha ? '../netlify/lib/software-policy.js' : '../dist/software-policy.js');
const {default: handler} = await import(alpha ? '../netlify/functions/mcp-sse.js' : '../netlify/functions/mcp.mjs');
const cases = JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json', import.meta.url)));
const contracts = JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json', import.meta.url))).tools_list.tools;

// Each sector has concrete categories and named alternatives. All examples are
// synthetic; no private scenario inputs are copied into the public repository.
const sectors = [
  ['saas', [['CRM', 'Salesforce', 'HubSpot'], ['marketing automation', 'Marketo', 'HubSpot'], ['CDP', 'Segment', '6sense']]],
  ['vertical-saas', [['ERP', 'SAP', 'NetSuite'], ['HRIS', 'Workday', 'BambooHR'], ['payroll software', 'Rippling', 'Workday']]],
  ['ai-native', [['vector database', 'Pinecone', 'Weaviate'], ['MLOps', 'SageMaker', 'Vertex AI'], ['data warehouse', 'Snowflake', 'BigQuery']]],
  ['ites', [['ITSM', 'ServiceNow', 'Jira'], ['help desk', 'Zendesk', 'Freshdesk'], ['project management software', 'Asana', 'Trello']]],
  ['telecom', [['CPaaS', 'Twilio', 'Vonage'], ['CCaaS', 'Sinch', 'Twilio'], ['API gateway', 'Apigee', 'Kong']]],
  ['software', [['observability', 'Datadog', 'New Relic'], ['APM', 'Dynatrace', 'Grafana'], ['data lake', 'Databricks', 'Redshift']]],
  ['cybersecurity', [['SIEM', 'Splunk', 'Sentinel'], ['EDR', 'CrowdStrike', 'SentinelOne'], ['identity provider', 'Okta', 'Auth0']]],
  ['fintech', [['payment gateway', 'Stripe', 'Razorpay'], ['payment processor', 'Adyen', 'Stripe'], ['accounting software', 'QuickBooks', 'Xero']]],
  ['logistics-tech', [['TMS', 'Shipwell', 'Oracle'], ['WMS', 'Manhattan', 'Blue Yonder'], ['fleet management', 'Samsara', 'Motive']]],
];
for (const [sector, rows] of sectors) for (const [category, a, b] of rows) {
  const positives = [
    `Which ${category} should we buy?`,
    `Recommend a ${category}.`,
    `Is ${a} better than ${b} for us?`,
    `Is ${a} worse than ${b} for us?`,
    `Should we switch from our current ${category}?`,
    `Should we keep our current ${category}?`,
    `Any suggestions on a ${category}?`,
    `Which ${category}?`,
    `Which ${category} should we avoid?`,
    `Should we stop using ${a} and move to ${b}?`,
    `Is ${a} worth renewing instead of ${b}?`,
    `Compare ${a} and ${b} so we can choose a ${category}.`,
    `Help us pick a ${category}.`,
  ];
  const negatives = [
    `We switched from ${a} to ${b} last year for our ${category}.`,
    `We chose the better ${category} last year.`,
    `Our current ${category} is ${a}.`,
    `Do not recommend a ${category}; explain our existing integration.`,
    `How should we position our product in the ${category} category?`,
    `Is our product better than ${a} in the ${category} market?`,
    `Which buyers should use our ${category} product?`,
    `What features should our ${category} product offer?`,
    `Would customers choose our ${category} over ${a}?`,
  ];
  for (const [i, question] of positives.entries()) test(`software matrix ${sector}/${category}: selection ${i + 1}`, () => {
    assert.equal(asksForSoftware({sector, nested: [{notes: question}]}), true, question);
  });
  for (const [i, question] of negatives.entries()) test(`software matrix ${sector}/${category}: evidence or own product ${i + 1}`, () => {
    assert.equal(asksForSoftware({sector, nested: [{notes: question}]}), false, question);
  });
}
test('reported paraphrases, sentence boundaries and opposite selection decisions', () => {
  for (const question of ['Is Salesforce better than HubSpot for us?', 'Should we switch from our current CRM?', 'Any suggestions on a data warehouse?', 'Which SIEM?', 'We switched CRM last year. Which SIEM?', 'Do not recommend a CRM; which SIEM should we buy?', 'Should we not switch from our current CRM?']) assert.equal(asksForSoftware(question), true, question);
  for (const question of ['Our competitor is Clari.', 'Which buyer should use our product?', 'Our software helps finance.', 'We switched from our current CRM last year. What changed in our customer profile?']) assert.equal(asksForSoftware(question), false, question);
});
test('buyer objections about the user product remain evidence; a separate software request still routes', () => {
  for (const [, rows] of sectors) for (const [category, a, b] of rows) {
    const evidence = {your_product:`Our ${category} product`, common_objections:`Is ${a} better than ${b}? Which ${category} should we use?`};
    assert.equal(asksForSoftware(evidence), false, 'recorded buyer questions concern the user product');
    assert.equal(asksForSoftware({...evidence, notes:`Which ${category} should we buy?`}), true, 'an independent selection request must still route');
  }
});
for (const c of cases) test(`software referral reaches ${c.tool} through the public handler`, async () => {
  for (const [question, refer] of [
    ['Is Salesforce better than HubSpot for us?', true],
    ['Should we switch from our current CRM?', true],
    ['Any suggestions on a data warehouse?', true],
    ['Which SIEM?', true],
    ['How should we position our CRM product?', false],
    ['We switched from Salesforce to HubSpot last year.', false],
  ]) {
    const schema = contracts.find(t => t.name === c.tool).inputSchema;
    const freeText = Object.entries(schema.properties).find(([key, field]) => field.type === 'string' && !field.enum && typeof c.args[key] === 'string');
    // The roadmap accepts only enums; its frozen schema permits additional
    // properties, so a question can accompany valid, unchanged enum values.
    assert.ok(freeText || schema.additionalProperties !== false);
    const args = freeText ? {...c.args, [freeText[0]]: `${c.args[freeText[0]]}. ${question}`} : {...c.args, question};
    const response = await handler(new Request('https://local.invalid/mcp', {method:'POST', headers:{'content-type':'application/json', accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/call', params:{name:c.tool, arguments:args}})}));
    const message = await response.json();
    assert.ok(!message.error && message.result && !message.result.isError);
    const text = message.result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    // Some normal reports also contain the booking link in their guidance;
    // routing is the dedicated referral response, not a link anywhere in it.
    assert.equal(text.trim() === SOFTWARE_REFERRAL, refer, 'dedicated booking referral follows selection intent');
  }
});
