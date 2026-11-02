import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
let id=0;
async function call(recent_losses,extra={}){
 const res=await handler(new Request('https://example.test/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method:'tools/call',params:{name:'icp_evolution_tracker',arguments:{current_icp:'Banks in India',product_category:'mobile application security',recent_losses,...extra}}})}));
 const body=await res.json();assert.ok(!body.error&&body.result&&!body.result.isError);return body.result.content.map(c=>c.text||'').join('\n');
}
const draft=text=>text.match(/- \*\*Qualify out on trial\*\*: ([^\n]+)/)?.[1];
const first=text=>text.match(/- \*\*First change to test\*\*: ([^\n]+)/)?.[1];
test('Guide 26: unclear loss reasons are held out of disqualifiers in the draft and detailed rows',async()=>{
 const loss='UAE insurer, stalled after the CISO left and no one owned the decision';
 const text=await call(loss);
 assert.doesNotMatch(text,/Candidate disqualifier[^\n]*UAE insurer/);
 assert.doesNotMatch(draft(text),/UAE insurer/);
 assert.match(draft(text),/held|nothing/i);
 assert.doesNotMatch(first(text),/qualifying out/);
 assert.match(text,/Loss reason unresolved[^\n]*UAE insurer/);
});
test('mixed losses keep the stated price candidate and exclude unclear cases from the proposed exclusion',async()=>{
 const text=await call('Indian NBFCs under 1,000 employees, 3 losses, price\nIndian bank, chose the security module of its existing mobile banking platform vendor\nUAE insurer, stalled after the CISO left and no one owned the decision\nIndian fintech, in-house build');
 assert.match(draft(text),/Indian NBFCs/);
 assert.doesNotMatch(draft(text),/Indian bank|UAE insurer|Indian fintech|loss cause is not clear/);
 assert.match(text,/Candidate disqualifier[^\n]*Indian NBFCs/);
});
test('negated or uncertain reasons never establish a trial disqualifier',async()=>{
 for(const loss of ['Price was not the reason. The project was cancelled.','Maybe the price was the reason.','The reason is not confirmed.']){
  const text=await call(loss);assert.doesNotMatch(text,/Candidate disqualifier/);assert.doesNotMatch(first(text),/qualifying out/);
 }
});
test('an unresolved first line cannot take priority over a later stated reason',async()=>{
 const text=await call('Bank, reason not recorded\nNBFC, lost on price');
 assert.match(first(text),/NBFC/);assert.doesNotMatch(first(text),/Bank/);assert.doesNotMatch(draft(text),/reason not recorded/);
});
test('known bundle reasons remain bounded candidates and empty inputs ask for evidence',async()=>{
 const known=await call('Large enterprises wanting an ERP-only expense module');assert.match(known,/Candidate disqualifier/);assert.match(draft(known),/ERP-only/);
 const empty=await call('');assert.match(draft(empty),/no losses were given/);assert.doesNotMatch(first(empty),/qualifying out/);
});
