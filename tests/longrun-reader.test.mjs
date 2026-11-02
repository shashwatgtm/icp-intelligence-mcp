import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
async function call(name,args){
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));
 const result=(await response.json()).result;assert.ok(result&&!result.isError);
 return result.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
}
const roleLines=text=>text.split('\n').filter(x=>/^(?:Founder|CEO|CMO|CRO|Demand generation head):/.test(x));
test('Market role checks use separate count, price, fit, share and capacity evidence',async()=>{
 const base=cases.find(x=>x.tool==='tam_sam_som_calculator').args;
 const first=roleLines(await call('tam_sam_som_calculator',base));
 assert.equal(first.length,5);assert.match(first[0],/2,400.*source|source.*2,400/);
 assert.match(first[1],/5(?:\.0)?% share.*capacity/);assert.match(first[2],/25% fit.*5(?:\.0)?% share.*assumptions/);
 assert.match(first[3],/12,000.*closed deals/);assert.match(first[4],/separate sample.*2,400.*25% fit/);
 const changed=roleLines(await call('tam_sam_som_calculator',{...base,total_potential_companies:180,average_contract_value:48000,icp_percentage:0,year1_market_share_target:0}));
 assert.match(changed[0],/180/);assert.match(changed[1],/0(?:\.0)?% share/);assert.match(changed[3],/48,000/);
 for(let i=0;i<5;i++)assert.notEqual(first[i],changed[i]);
 assert.doesNotMatch(changed.join('\n'),/undefined|NaN|not stated%/);
});
test('Buyer roles use the supplied contact and amount without conferring authority from a title',async()=>{
 const args={product_category:'Alert triage software',deal_size:'$90000 annual',known_stakeholders:['SOC manager','CISO'],typical_champion:'SOC manager'};
 const text=await call('buyer_group_analyzer',args), lines=roleLines(text);
 assert.match(lines[0],/SOC manager.*own words/);assert.match(lines[1],/90,000|90000/);
 assert.match(lines[1],/do not assign that power from a job title/);
 assert.match(lines[2],/SOC manager, CISO/);assert.match(lines[3],/arrange contact with the actual approver/);
 assert.doesNotMatch(lines.join('\n'),/Finance controller/);
});
test('Interview actions retain differing reported problems and keep unmeasured outcomes limited',async()=>{
 const args=cases.find(x=>x.tool==='icp_interview_synthesizer').args;
 const text=await call('icp_interview_synthesizer',args),lines=roleLines(text);
 assert.match(lines[0],/Double booking, No shows/);assert.match(lines[0],/Clinic A, Clinic B/);
 assert.match(lines[1],/mark any unmeasured claim/);assert.match(lines[2],/publication permission/);
 assert.match(lines[3],/purchase authority/);assert.match(lines[4],/outside Clinic A, Clinic B/);
});
test('Absent optional fit and share retain an explicit assumption label',async()=>{
 const text=await call('tam_sam_som_calculator',{total_potential_companies:500,average_contract_value:10000});
 const lines=roleLines(text).join('\n');assert.match(lines,/displayed fit assumption/);assert.match(lines,/displayed share assumption/);
 assert.doesNotMatch(lines,/undefined|NaN|assumption%/);
});
