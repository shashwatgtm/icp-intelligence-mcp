import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
async function call(f,share){
 const args={product_category:f.product,segment_name:f.audience,total_potential_companies:1000,average_contract_value:24000,icp_percentage:20,year1_market_share_target:share};
 const res=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'tam_sam_som_calculator',arguments:args}})}));
 const b=await res.json();assert.ok(b.result&&!b.result.isError,JSON.stringify(b));return b.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
}
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 test(`${f.id}: excessive share is explained without changing counts`,async()=>{
  for(const share of [40,60]){
   const out=await call(f,share);assert.match(out,/a share of the same market cannot exceed 100%/);assert.match(out,/exceeds SAM/);
   // The original multiplication stays visible, including the owner-pinned customer counts.
   const counts=share===40?[80,160,320]:[120,240,480];
   for(let y=1;y<=3;y++){
    const row=out.split('\n').find(l=>l.startsWith(`| Year ${y} |`));assert.ok(row);assert.ok(row.endsWith(`| ${counts[y-1]} |`),row);
   }
   assert.equal(out,await call(f,share));
  }
  const possible=await call(f,20);assert.doesNotMatch(possible,/exceeds SAM|cannot exceed 100%/);
  assert.match(possible,/\| Year 3 \| 80\.0%/);
 });
}
