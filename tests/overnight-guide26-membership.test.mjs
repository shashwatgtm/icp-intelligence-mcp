import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
import {evolutionMatch} from '../src/evolution-membership.ts';
const icp='Banks, NBFCs and insurers in India with a customer-facing mobile app of 1 million or more installs. Trigger: a regulator mandate on mobile app security. Signer: CISO. Champion: Head of Digital Banking.';
const bank='Indian private bank, Head of Digital Banking champion, regulator mandate trigger';
let id=0;
async function call(recent_wins,extra={}){
 const res=await handler(new Request('https://example.test/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method:'tools/call',params:{name:'icp_evolution_tracker',arguments:{current_icp:icp,product_category:'mobile app security and fraud control for banks and insurers',recent_wins,...extra}}})}));
 const body=await res.json();assert.ok(!body.error&&body.result&&!body.result.isError);return body.result.content.map(c=>c.text||'').join('\n');
}
const add=text=>text.match(/- \*\*Add on trial\*\*: ([^\n]+)/)?.[1];
test('Guide 26: the Indian private bank matches four recorded parts and is not proposed as an addition',async()=>{
 const text=await call(bank);
 assert.match(text,/Matches recorded ICP parts[^\n]*Indian private bank/);
 assert.doesNotMatch(text,/Candidate addition[^\n]*Indian private bank/);
 assert.doesNotMatch(add(text),/Indian private bank/);
 assert.match(text,/not recorded or not comparable: signer and app installs/i);
 assert.doesNotMatch(text,/Confirms your ICP|it matches your current ICP, so keep it/);
  assert.match(text,/\*\*Signer in your ICP\*\*: CISO/);
  assert.match(text,/\*\*Champion in your ICP\*\*: Head of Digital Banking/);
  assert.doesNotMatch(text,/whether Head of Digital Banking is the one who signs/);
});
test('exact and equivalent recorded places and role spellings produce the same bounded comparison',()=>{
 for(const record of [bank,'Private banks in India, Head of Digital Banking champion, regulatory mandate trigger']){
  const match=evolutionMatch(icp,record);assert.deepEqual([...match.matched].sort(),['champion','place','segment','trigger']);assert.deepEqual(match.different,[]);assert.deepEqual(match.unknown,['signer','app installs']);
 }
});
test('a UAE bank retains the bank match and identifies the country and champion differences',async()=>{
 const record='UAE retail bank, Head of Fraud Risk champion, regulator mandate trigger';
 const match=evolutionMatch(icp,record);assert.deepEqual(match.matched,['segment','trigger']);assert.deepEqual(match.different,['place','champion']);
 const text=await call(record);assert.match(text,/Candidate addition[^\n]*UAE retail bank[^\n]*different recorded parts: place and champion/i);
 assert.doesNotMatch(text,/this is not in your current ICP/);
});
test('same segment with another champion or trigger is a candidate change, not a new segment',async()=>{
 const record='Indian NBFC, CISO champion, fraud incident on the app';
 const match=evolutionMatch(icp,record);assert.deepEqual(match.matched,['segment','place']);assert.deepEqual(match.different,['champion','trigger']);
 const text=await call(record);assert.match(text,/Candidate change[^\n]*Indian NBFC/);assert.doesNotMatch(text,/Candidate addition[^\n]*Indian NBFC/);
});
test('a champion role never supplies missing signer evidence',()=>{
 const match=evolutionMatch(icp,'Indian bank, CISO champion, regulator mandate trigger');assert.ok(match.unknown.includes('signer'));assert.ok(match.different.includes('champion'));
 const explicit=evolutionMatch(icp,'Indian bank; Champion: Head of Digital Banking; Signer: Chief Information Security Officer; Trigger: regulator mandate');assert.ok(explicit.matched.includes('signer'));
});
test('missing or denied details stay unknown and never confirm complete fit',async()=>{
 for(const record of ['Bank','Indian bank, champion not recorded','Indian bank, no regulator mandate trigger']){
  const match=evolutionMatch(icp,record);assert.ok(match.unknown.length>0);assert.deepEqual(match.different,[]);
  const text=await call(record);assert.doesNotMatch(text,/Confirms your ICP|this is not in your current ICP/);assert.doesNotMatch(add(text),new RegExp(record.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 }
});
test('a broad bank criterion does not make a bank-facing software seller or a role title into a matching bank',()=>{
 for(const record of ['Software vendor serving banks, Head of Digital Banking champion','Head of Digital Banking, regulator mandate trigger']){
  assert.notEqual(evolutionMatch(icp,record).parts.find(p=>p.name==='segment')?.state,'match');
 }
});
test('line reordering preserves each record classification and missing fields',async()=>{
 const other='UAE retail bank, Head of Fraud Risk champion, regulator mandate trigger';
 const a=await call(bank+'\n'+other),b=await call(other+'\n'+bank);
 const lines=t=>t.split('\n').filter(l=>/^- \*\*(?:Matches recorded ICP parts|Candidate addition|Candidate change)\*\*/.test(l)).sort();
 assert.deepEqual(lines(a),lines(b));assert.equal(lines(a).length,2);
});
test('multiple candidate changes do not get ranked by the order of the supplied win lines',async()=>{
 const a='UAE retail bank, Head of Fraud Risk champion, regulator mandate trigger',b='Indian stockbroker, Head of Fraud Risk champion, fraud incident trigger';
 const one=await call(a+'\n'+b),two=await call(b+'\n'+a);
 const first=t=>t.match(/- \*\*First change to test\*\*: ([^\n]+)/)?.[1];
 assert.equal(first(one),first(two));assert.doesNotMatch(first(one),/^Test adding/);assert.match(first(one),/Compare/);
 assert.equal(add(one),add(two));
});
