import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
for(const c of cases)test('Round 5 reader contract: '+c.tool,async()=>{
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:c.tool,arguments:c.args}})}));
 const r=(await response.json()).result;assert.ok(r&&!r.isError);
 const text=r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
 assert.match(text,/## Reading the answer/);
 assert.match(text,/The conclusion needs review if|Change scope if/);
 for(const role of ['Founder','CEO','CMO','CRO','Demand generation head'])assert.match(text,new RegExp('(?:^|\\n)'+role+':'));
 assert.doesNotMatch(text,/_{3,}|icp firmographics\.(?:industries|company sizes|locations)|\[(?:Your name|Competitor A|YOUR WHITESPACE|target customer)\]/);
});

test('TAM retains explicit billing evidence when the sector reader has no match',async()=>{
 const lines=[];
 for(const phrase of ['We charge a monthly subscription per user.','Customers pay us a recurring monthly fee for each user.']){
  const args={total_potential_companies:2400,average_contract_value:12000,icp_percentage:25,year1_market_share_target:5,product_category:'Inventory ledger software for manufacturing teams. '+phrase};
  const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'tam_sam_som_calculator',arguments:args}})}));
  const result=(await response.json()).result;assert.ok(result&&!result.isError);const text=result.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
  assert.match(text,/SOM = \$360K/);const line=text.match(/Business model: ([^\n]*)/)?.[1];assert.ok(line);lines.push(line);
 }
 assert.equal(lines[0],lines[1]);
});
