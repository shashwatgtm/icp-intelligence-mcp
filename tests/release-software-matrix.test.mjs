import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const alpha = existsSync(new URL('../netlify/functions/mcp-sse.js', import.meta.url));
const {asksForSoftware, classifySoftwareQuestion, SOFTWARE_REFERRAL, SOFTWARE_OUTSIDE_SCOPE} = await import(alpha ? '../netlify/lib/software-policy.js' : '../dist/software-policy.js');
const {default: handler} = await import(alpha ? '../netlify/functions/mcp-sse.js' : '../netlify/functions/mcp.mjs');
const cases = JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json', import.meta.url)));
const contracts = JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json', import.meta.url))).tools_list.tools;

// Each sector has concrete categories and named alternatives. All examples are
// synthetic; no private scenario inputs are copied into the public repository.
const sectors = [
  ['saas', 'to track expansion revenue and product-qualified leads', ['CRM','Salesforce','HubSpot'], ['data warehouse','Snowflake','BigQuery']],
  ['vertical-saas', 'to reach construction estimators before bid deadlines', ['marketing automation','Marketo','HubSpot'], ['ERP','SAP','NetSuite']],
  ['ai-native', 'to reach ML platform leads after a paid inference evaluation', ['sales engagement','Outreach','Salesloft'], ['vector database','Pinecone','Weaviate']],
  ['ites', 'to sell a scoped migration with acceptance milestones and delivery margin', ['revenue intelligence','Clari','Gong'], ['ITSM','ServiceNow','Jira']],
  ['telecom', 'to coordinate enterprise renewals for multi-site SD-WAN contracts', ['CPQ','Salesforce','HubSpot'], ['CPaaS','Twilio','Vonage']],
  ['software', 'to recruit integration partners for an on-premise annual licence', ['partner tools','PartnerStack','Crossbeam'], ['observability','Datadog','New Relic']],
  ['cybersecurity', 'to engage CISOs during a proof of value and procurement review', ['ABM','Demandbase','6sense'], ['SIEM','Splunk','Sentinel']],
  ['fintech', 'to reach bank controllers before a reconciliation pilot', ['customer success platform','Gainsight','ChurnZero'], ['payment gateway','Stripe','Razorpay']],
  ['logistics-tech', 'to sell to transport directors measured on empty miles and on-time delivery', ['sales analytics','Clari','Salesforce'], ['TMS','Shipwell','Oracle']],
];
for (const [sector, context, gtm, outside] of sectors) for (const [outcome, [category, a, b]] of [['gtm',gtm],['outside',outside]]) {
  const positives = [
    `Which ${category} should we buy?`, `Which ${category} should we buy ${context}?`, `Recommend a ${category}.`,
    `Is ${a} better than ${b} for us?`, `Is ${a} worse than ${b} for us?`,
    `Should we switch from our current ${category}?`, `Should we keep our current ${category}?`,
    `Any suggestions on a ${category}?`, `Which ${category}?`, `Which ${category} should we avoid?`,
    `Should we stop using ${a} and move to ${b}?`, `Is ${a} worth renewing instead of ${b}?`,
    `Compare ${a} and ${b} so we can choose a ${category}.`, `Help us pick a ${category}.`,
    `Should we not switch from our current ${category}?`,
  ];
  const negatives = [
    `We switched from ${a} to ${b} last year for our ${category}.`,
    `Which campaigns should we run in ${a}?`, `Which reports should we read in ${a}?`,
    `We chose the better ${category} last year.`, `Our current ${category} is ${a}.`,
    `Do not recommend a ${category}; explain our existing integration.`,
    `How should we position our product in the ${category} category?`,
    `Is our product better than ${a} in the ${category} market?`,
    `Which buyers should use our ${category} product?`, `What features should our ${category} product offer?`,
    `Would customers choose our ${category} over ${a}?`,
  ];
  for (const [i, question] of positives.entries()) test(`software scope ${sector}/${category}: selection ${i+1}`, () => {
    assert.equal(classifySoftwareQuestion({context, nested:[{notes:question}]}),outcome,question);
  });
  for (const [i, question] of negatives.entries()) test(`software scope ${sector}/${category}: evidence ${i+1}`, () => {
    assert.equal(classifySoftwareQuestion({context,nested:[{notes:question}]}),'none',question);
  });
}
test('all owner GTM categories have booking scope across every vertical', () => {
  for(const [sector,context] of sectors) for(const category of ['CRM','marketing automation','sales engagement','ABM','intent data','enrichment','revenue intelligence','conversation intelligence','CPQ','customer success platforms','analytics for marketing and sales','marketing analytics','sales analytics','content tools','SEO tools','event tools','webinar tools','partner tools']) {
    assert.equal(classifySoftwareQuestion({sector,context,request:`Which ${category} should we buy?`}),'gtm',category);
  }
});
test('all owner outside categories stay outside across every vertical', () => {
  for(const [sector,context] of sectors) for(const category of ['data warehouse','SIEM','cloud','ERP','HRIS','payroll software','developer tools','security tooling','logistics TMS','payment gateways']) {
    assert.equal(classifySoftwareQuestion({sector,context,request:`Which ${category} should we buy?`}),'outside',category);
  }
});
test('named tools and software categories used only as context do not request selection',()=>{
  for(const question of ['Choose a go to market motion for dispatch planning software sold to regional fleets.', 'Recommend a positioning strategy for our CRM software.', 'What is CRM?', 'Which metrics should we track in Salesforce?', 'What content should we publish about security software?', 'How does our existing data warehouse work?', 'Which buyer roles use our SIEM?', 'We use HubSpot. What should our campaign message say?']) assert.equal(classifySoftwareQuestion(question),'none',question);
  for(const question of ['What CRM should we buy?', 'What is better for us, Salesforce or HubSpot?', 'What data warehouse would suit us?']) assert.notEqual(classifySoftwareQuestion(question),'none',question);
});
test('selection category takes precedence over the field or use case',()=>{
  for(const q of ['Which CRM should we buy for our cloud security sales team?', 'Should we switch CRM to support our payroll software sales?', 'Is Salesforce better than HubSpot for selling ERP migrations?']) assert.equal(classifySoftwareQuestion(q),'gtm',q);
  for(const q of ['Which data warehouse should we buy for marketing analytics?', 'Which SIEM should we buy to support our CRM team?']) assert.equal(classifySoftwareQuestion(q),'outside',q);
});
test('labelled plan risks and buyer objections are evidence; a separate direct request still routes',()=>{
  assert.equal(classifySoftwareQuestion('What sets it apart: We help buyers choose software using a single platform.'),'none');
  assert.equal(classifySoftwareQuestion({document_content:'Goal: win five pilots.\nRisks: Which CRM should we buy?'}),'none');
  assert.equal(classifySoftwareQuestion({known_objections:'Which SIEM should we buy?',blockers:'Which data warehouse?'}),'none');
  assert.equal(classifySoftwareQuestion({known_objections:'Which SIEM should we buy?',notes:'Which CRM should we buy?'}),'gtm');
});
test('reported paraphrases, sentence boundaries and opposite selection decisions', () => {
  for (const question of ['Is Salesforce better than HubSpot for us?', 'Should we switch from our current CRM?', 'Any suggestions on a data warehouse?', 'Which SIEM?', 'We switched CRM last year. Which SIEM?', 'Do not recommend a CRM; which SIEM should we buy?', 'Should we not switch from our current CRM?']) assert.equal(asksForSoftware(question), true, question);
  for (const question of ['Our competitor is Clari.', 'Which buyer should use our product?', 'Our software helps finance.', 'We switched from our current CRM last year. What changed in our customer profile?']) assert.equal(asksForSoftware(question), false, question);
});
test('buyer objections about the user product remain evidence; a separate software request still routes', () => {
  for (const [, , gtm, outside] of sectors) for (const [category, a, b] of [gtm,outside]) {
    const evidence = {your_product:`Our ${category} product`, common_objections:`Is ${a} better than ${b}? Which ${category} should we use?`};
    assert.equal(asksForSoftware(evidence), false, 'recorded buyer questions concern the user product');
    assert.equal(asksForSoftware({...evidence, notes:`Which ${category} should we buy?`}), true, 'an independent selection request must still route');
  }
});
for (const c of cases) test(`software referral reaches ${c.tool} through the public handler`, async () => {
  for (const [question, refer] of [
    ['Is Salesforce better than HubSpot for us?', 'gtm'],
    ['Should we switch from our current CRM?', 'gtm'],
    ['Any suggestions on a data warehouse?', 'outside'],
    ['Which SIEM?', 'outside'],
    ['How should we position our CRM product?', 'none'],
    ['We switched from Salesforce to HubSpot last year.', 'none'],
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
    assert.equal(text.trim() === SOFTWARE_REFERRAL, refer === 'gtm');
    assert.equal(text.trim() === SOFTWARE_OUTSIDE_SCOPE, refer === 'outside');
    if(refer === 'outside') { assert.doesNotMatch(text,/calendly|https?:/i); assert.match(text,/tool and Helix do not advise/); assert.match(text,/specialist/); }
  }
});
