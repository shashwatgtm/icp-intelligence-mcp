import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url)));
const call=async(name,args)=>{const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));const b=await response.json();assert.ok(!b.error);assert.ok(!b.result.isError,JSON.stringify(b.result));return b.result.content.map(c=>c.text||'').join('\n');};

test('M082 exact customer counts and bank type stay distinct',async()=>{
 const seed=cases.find(x=>x.tool==='icp_gap_analysis');const out=await call(seed.tool,{...seed.args,current_customers:'Commercial banks with 500 employees.',ideal_icp:'Commercial banks with 1000 employees.'});
 assert.match(out,/500 employees/);assert.match(out,/1000 employees/);assert.match(out,/commercial banks/i);assert.doesNotMatch(out,/Neither text names an industry|Neither profile states a company size/);
 for(const phrase of ['500 employees','500 staff','500 to 1000 staff']){const seed=cases.find(x=>x.tool==='icp_deep_dive');const out=await call(seed.tool,{...seed.args,customers:undefined,customer_descriptions:'Commercial banks with '+phrase+'.'});assert.match(out,new RegExp(phrase));assert.doesNotMatch(out,/Mixed sizes/);}
});
for(const role of ['Risk lead','Procurement analyst','Compliance reviewer'])test('M083 '+role+' is participation, not advocacy',async()=>{
 const seed=cases.find(x=>x.tool==='icp_interview_synthesizer');const quote='I reviewed the checklist. I did not sponsor this purchase and cannot approve its budget.';
 const args={...seed.args,interview_notes:[{customer:'Synthetic interview',role,key_quotes:[quote],pain_points:['Checklist handoffs'],buying_triggers:['Review due'],value_realized:['No measured result supplied']}]};
 const first=await call(seed.tool,args);assert.doesNotMatch(first,/Champion is(?: one of)?:/);assert.match(first,/interview role/i);assert.ok(first.includes(quote));assert.equal(await call(seed.tool,args),first);assert.equal(await call(seed.tool,args),first);
});
