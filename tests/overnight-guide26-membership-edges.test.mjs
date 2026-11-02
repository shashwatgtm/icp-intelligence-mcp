import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evolutionMatch} from '../src/evolution-membership.ts';
import handler from '../netlify/functions/mcp.mjs';
const icp='Banks in India. Trigger: regulator mandate. Signer: CISO. Champion: Head of Digital Banking.';
const part=(record,name,current=icp)=>evolutionMatch(current,record).parts.find(p=>p.name===name)?.state;
test('a bank-facing vendor, platform or agency is not classified as a bank',()=>{
 for(const record of ['Indian bank security software vendor','Indian banking software platform','Indian bank marketing agency','Indian vendor serving banks']) assert.notEqual(part(record,'segment'),'match',record);
});
test('a mix of matching and other locations requires clarification',()=>{
 assert.equal(part('Bank in India and UAE','place'),'unknown');
 assert.equal(part('UAE retail bank','place'),'different');
 assert.equal(part('Bank in India','place'),'match');
});
test('a separate explicit location clause is recognised without borrowing a country from a role or trigger',()=>{
 assert.equal(part('Private bank, in India','place'),'match');
 assert.equal(part('Private bank, Head of Digital Banking champion at the India office','place'),'unknown');
});
test('mixed recorded signers or champions do not automatically establish a changed requirement',()=>{
 assert.equal(part('Indian bank, CISO signer, CFO signer','signer'),'unknown');
 assert.equal(part('Indian bank, Head of Digital Banking champion, Head of Fraud Risk champion','champion'),'unknown');
});
test('an explicitly recorded signer is distinct from a champion, including a natural signing clause',()=>{
 assert.equal(part('Indian bank, CISO signed','signer'),'match');
 assert.equal(part('Indian bank, CISO champion','signer'),'unknown');
 assert.equal(part('Indian bank, CISO did not sign','signer'),'unknown');
});
test('a known place beyond the short demonym table is retained as a requirement',()=>{
 assert.equal(part('Banks in Brazil','place','Banks in Belgium'),'different');
 assert.equal(part('Belgian banks','place','Banks in Belgium'),'unknown');
});
test('unknown or denied geography and role notes never confirm a requirement',()=>{
 assert.equal(part('A bank not in India','place'),'unknown');
 assert.equal(part('Maybe an Indian bank','place'),'unknown');
 assert.equal(part('Indian bank, maybe CISO signer','signer'),'unknown');
});
test('a role fragment, empty observation or unknown segment is held',()=>{
 for(const record of ['Head of Digital Banking','','Segment not recorded','Maybe a bank'])assert.equal(part(record,'segment'),'unknown',record);
});
test('an unknown or denied criterion does not become a positive requirement',()=>{
 const current='Banks in India. Champion: not confirmed. Signer: unknown. Trigger: maybe a regulator mandate.';
 const match=evolutionMatch(current,'Indian bank, CISO champion, CFO signer, regulator mandate trigger');
 for(const name of ['champion','signer','trigger'])assert.equal(match.parts.find(p=>p.name===name)?.state,'unknown',name);
 assert.deepEqual(match.different,[]);
});
test('semicolons between labelled fields retain one observation in the actual handler',async()=>{
 const recent_wins='Segment: private bank; Place: India; Champion: Head of Digital Banking; Signer: CISO; Trigger: regulator mandate';
 const response=await handler(new Request('https://example.test/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'icp_evolution_tracker',arguments:{current_icp:icp,recent_wins,product_category:'mobile app security'}}})}));
 const raw=await response.json();assert.ok(raw.result&&!raw.result.isError);const text=raw.result.content.map(c=>c.text||'').join('\n');
 const rows=text.split('### Recent Wins\n')[1].split('### Recent Losses')[0].split('\n').filter(l=>l.startsWith('- **'));
 assert.equal(rows.length,1);assert.match(rows[0],/Matches recorded ICP parts/);assert.match(rows[0],/segment, place, champion, signer and trigger/);
});
