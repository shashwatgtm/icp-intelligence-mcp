// Echo fix, row 6: lookalike_signal_generator. The company size band must change the targeting criteria and signals.
// Run: node --no-warnings --test tests/echo-fixes-20261106.test.mjs  (after npm run build)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {default:handler}=await import('../netlify/functions/mcp.mjs');
const pair=JSON.parse(readFileSync(new URL('./fixtures/echo-pairs-20261106.json',import.meta.url),'utf8')).find(p=>p.row===6);
const call=async(args)=>{
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:pair.tool,arguments:args}})}));
 const j=await r.json();assert.ok(j.result&&j.result.content,JSON.stringify(j).slice(0,300));assert.ok(!j.result.isError,j.result.content[0].text.slice(0,300));
 return j.result.content.map(c=>c.text).join('\n');
};
const section=(t)=>{const a=t.indexOf('### Targeting for the size band');assert.ok(a>=0,'missing size section');return t.slice(a,t.indexOf('### Saved Search Strategy',a));};
test('Row 6: a larger band changes the titles, the search lines and the signals, not only the echoed band',async()=>{
 const base=await call(pair.base),changed=await call(pair.changed);
 const sb=section(base),sc=section(changed);
 assert.match(sc,/multi site group with central teams/);
 for(const w of [/VP of Operations/,/Group CIO/,/Group Director of Procurement/,/central BDC/,/rooftop/i,/acquiring another rooftop/i,/group level IT and procurement job posts/i])assert.match(sc,w);
 assert.match(sc,/Seniority level: VP, CXO/);assert.match(sc,/Function: Operations, Information Technology, Procurement/);
 assert.match(sc,/Exclude: single rooftop dealers/);
 assert.doesNotMatch(sb,/VP of Operations|Group CIO|central BDC/);
 assert.match(sb,/department heads decide/);assert.match(sb,/Seniority level: Director, VP, Manager/);
 // The signals and the titles differ once the band text is removed.
 const strip=t=>t.replace(/1,001 to 5,000 employees|100 to 1,000 employees/g,'BAND');
 assert.notEqual(strip(sb),strip(sc));
 const signals=t=>t.slice(t.indexOf('**Signals that matter'),t.indexOf('These are search criteria'));
 assert.notEqual(signals(sb),signals(sc));
 assert.ok(!/[—–]/.test(sc));
});
test('Row 6: a small owner led band targets the owner, not group titles',async()=>{
 const t=await call({...pair.base,icp_firmographics:{...pair.base.icp_firmographics,company_sizes:['1 to 50 employees']}});
 const s=section(t);
 assert.match(s,/owner led/);assert.match(s,/Seniority level: Owner, Founder, CXO/);assert.doesNotMatch(s,/Group CIO/);
});
test('Row 6: the same input gives the same output',async()=>{
 assert.equal(await call(pair.changed),await call(pair.changed));
});
