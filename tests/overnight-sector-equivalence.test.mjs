import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {explainSector, detectModel} from '../dist/verticals.js';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
const prefix='Inventory ledger software for manufacturing teams. ';
const exact='We charge a monthly subscription per user.';
const same='Customers pay us a recurring monthly fee for each user.';
const opposite='We do not sell subscriptions and do not charge per user. Customers pay once for a perpetual licence.';
test('Generic software sector recognizes equivalent affirmative billing and rejects denied signals',()=>{
 for(const phrase of [exact,same,'We charge a monthly fee per user.'])assert.equal(explainSector(prefix+phrase).vertical?.id,'saas');
 for(const phrase of [opposite,'We do not charge a recurring monthly fee per user.','We do not sell subscriptions.']){
  assert.equal(explainSector(prefix+phrase).vertical,null,phrase);
  assert.equal(detectModel(undefined,{seller:[prefix+phrase]}).model,null,phrase);
 }
 assert.equal(explainSector('Customers pay us a recurring monthly fee.').vertical,null);
 assert.equal(explainSector('Managed IT services. Customers pay us a recurring monthly fee.').vertical?.id,'ites');
});
const sector=t=>(t.split('\n').find(x=>/^\*Sector(?: notes)?:/.test(x))?.split('Business model:')[0]||'').replace(/ \(you sell “[^”]*”\)/g,'').replace(/ \(“[^”]*”\)/g,'').trim();
async function call(tool,args){const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));const data=(await r.json()).result;assert.ok(data&&!data.isError);return data.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');}
for(const c of cases)test('Billing equivalence preserves the sector for '+c.tool,async()=>{
 const a={...c.args,product_category:prefix+exact},b={...c.args,product_category:prefix+same};delete a.business_model;delete b.business_model;
 const one=await call(c.tool,a),two=await call(c.tool,b);
 assert.equal(sector(one),sector(two));assert.match(sector(one),/SaaS/);
 const denied=await call(c.tool,{...a,product_category:prefix+opposite});
 assert.doesNotMatch(denied,/Business model: software subscription/);
});
