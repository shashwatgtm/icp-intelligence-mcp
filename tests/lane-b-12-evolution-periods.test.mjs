import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
async function call(f,time_period){
 const args={current_icp:f.audience,product_category:f.product,recent_wins:`One evaluation with ${f.buyer} addressed ${f.pain}`,time_period};
 const r=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'icp_evolution_tracker',arguments:args}})}));const b=await r.json();assert.ok(b.result&&!b.result.isError,JSON.stringify(b));return b.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
}
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id)))test(`${f.id}: quarter comparisons and rolling months retain their meaning`,async()=>{
 for(const period of ['Q1 2026 vs Q3 2026','Q1 2026 compared with Q3 2026']){
  const out=await call(f,period);assert.match(out,/Compare Q1 2026 \(2026-01-01 to 2026-03-31\) with Q3 2026 \(2026-07-01 to 2026-09-30\)/);assert.equal(out,await call(f,period));
 }
 const reverse=await call(f,'Q3 2026 vs Q1 2026');assert.match(reverse,/Compare Q3 2026 .* with Q1 2026/);
 for(const period of ['last 6 months','past six months'])assert.match(await call(f,period),/Review the last 6 months as a rolling window/);
 const shorter=await call(f,'last 3 months');assert.match(shorter,/Review the last 3 months/);assert.doesNotMatch(shorter,/Review the last 6 months/);
 assert.doesNotMatch(await call(f,'Not last 6 months; the dates are not confirmed'),/Review the last 6 months as a rolling window/);
});
