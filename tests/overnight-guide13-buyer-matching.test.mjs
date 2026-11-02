import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
let id = 1;
const base = {product_category:'cloud-native merchant acquiring platform for banks', company:'Juspay', deal_size:'$500,000 a year (illustrative)', target_company_size:'mid-sized private banks with a merchant acquiring business', typical_champion:'Head of Merchant Acquiring', known_stakeholders:['CIO','CISO','Chief Risk Officer','Head of Procurement','Chief Digital Officer']};
async function call(args) {
  const response = await handler(new Request('https://example.test/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:id++,method:'tools/call',params:{name:'buyer_group_analyzer',arguments:args}})}));
  const raw = await response.json(); assert.equal(response.status,200); assert.ok(!raw.error && !raw.result.isError);
  return raw.result.content.map(c=>c.text||'').join('\n');
}
const role = (text,heading) => text.match(new RegExp(`### ${heading}[^\\n]*\\n\\*\\*Role\\*\\*: ([^\\n]+)`))?.[1];
test('Guide 13: both captured orders recognise CIO as a technical hypothesis without claiming budget authority',async()=>{
  for (const known_stakeholders of [base.known_stakeholders,[base.known_stakeholders.at(-1),...base.known_stakeholders.slice(0,-1)]]) {
    const text = await call({...base,known_stakeholders});
    assert.equal(role(text,'Technical Evaluator'),'CIO');
    assert.notEqual(role(text,'Economic Buyer'),'CIO');
    assert.match(text,/Budget authority: Who can approve the spend/);
    assert.match(text,/### Technical Evaluator[^\n]*\n\*\*Role\*\*: CIO\n\*\*Evidence\*\*: Role hypothesis only\. Title supplied; contact and decision evidence unconfirmed/);
    assert.match(text,/Who owns technical acceptance/);
    assert.match(text,/Authority unconfirmed[^\n]*Chief Digital Officer/);
    assert.doesNotMatch(text,/### Technical Evaluator[^\n]*\n[^\n]*none of your stakeholders fits/);
  }
});
test('spelled out Chief Information Officer and CIO have the same technical meaning for this purchase',async()=>{
  for(const title of ['Chief Information Officer','chief information officer','cio']) {
    const text=await call({...base,known_stakeholders:[title,'CISO','Head of Procurement']});
    assert.equal(role(text,'Technical Evaluator'),title);
    assert.notEqual(role(text,'Economic Buyer'),title);
  }
});
test('a vertical SaaS CIO occupies its own sector technical seat',async()=>{
  const text=await call({product_category:'sales force automation for FMCG retail execution',typical_champion:'Head of Sales Operations',known_stakeholders:['CIO','National Sales Head','Regional Sales Manager']});
  assert.equal(role(text,'Technical Evaluator'),'CIO');
  assert.equal(role(text,'Economic Buyer'),'National Sales Head');
});
test('CIO and Head of IT remain separate people and both supplied titles stay visible',async()=>{
  const text=await call({...base,known_stakeholders:['Head of IT','CIO','CFO']});
  assert.equal(role(text,'Technical Evaluator'),'Head of IT');
  assert.match(text,/Also in the group \(your input\)[^\n]*CIO \(technical evaluation\)/);
  assert.doesNotMatch(text,/not in your list[^\n]*Head of IT/);
});
test('telecom and IT services retain the sector budget hypothesis without confirming authority',async()=>{
  for(const product_category of ['managed SD-WAN for branch offices','managed IT services']) {
    const text=await call({product_category,typical_champion:'Network Manager',known_stakeholders:['CIO','CISO','Head of Procurement']});
    assert.equal(role(text,'Economic Buyer'),'CIO');
    assert.match(text,/Economic Buyer hypothesis \(budget authority unconfirmed\)/);
    assert.notEqual(role(text,'Technical Evaluator'),'CIO');
  }
});
test('investment CIO keeps its distinct investment meaning',async()=>{
  const text=await call({product_category:'AI research assistant for investment management firms',typical_champion:'Portfolio Manager',known_stakeholders:['CIO','risk teams']});
  assert.equal(role(text,'Economic Buyer'),'CIO');
  assert.notEqual(role(text,'Technical Evaluator'),'CIO');
  assert.doesNotMatch(text,/not in your list[^\n]*Chief Investment Officer/);
  const information=await call({product_category:'AI research assistant for investment management firms',typical_champion:'Portfolio Manager',known_stakeholders:['Chief Information Officer','risk teams']});
  assert.equal(role(information,'Technical Evaluator'),'Chief Information Officer');
});
test('CIO does not replace a named champion or turn explicit denial into a technical assignment',async()=>{
  const champion=await call({...base,typical_champion:'CIO',known_stakeholders:['CIO','CFO','Head of IT']});
  assert.equal(role(champion,'Technical Evaluator'),'Head of IT');
  for(const title of ['CIO (no approval authority)','CIO (not responsible for technical evaluation)']) {
    const text=await call({...base,known_stakeholders:[title,'CISO']});
    assert.notEqual(role(text,'Technical Evaluator'),title);
    assert.match(text,/Authority unconfirmed[^\n]*CIO/);
  }
});
