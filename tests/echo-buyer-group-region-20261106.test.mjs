// Row 11: buyer_group_analyzer gets "India" inside target_company_size. The question must go and the India section must appear.
// Run: node --no-warnings --test tests/echo-buyer-group-region-20261106.test.mjs  (after npm run build)
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {default:handler}=await import('../netlify/functions/mcp.mjs');
const QUESTION='Region context: Which region applies';
const call=async(args)=>{
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'buyer_group_analyzer',arguments:args}})}));
 const j=await r.json();assert.ok(j.result&&j.result.content,JSON.stringify(j).slice(0,300));
 return j.result.content.map(c=>c.text).join('\n');
};
const BASE={product_category:'cloud-native merchant acquiring platform for banks',company:'Juspay',deal_size:'$500,000 a year (illustrative)',typical_champion:'Head of Merchant Acquiring',known_stakeholders:['Chief Digital Officer','CIO','CISO','Chief Risk Officer','Head of Procurement']};
test('buyer_group_analyzer: India in target_company_size gives an India section and no question',async()=>{
 const t=await call({...BASE,target_company_size:'mid-sized private banks in India with a merchant acquiring business'});
 assert.ok(t.includes('### India'),t.slice(-500));assert.ok(!t.includes(QUESTION));
});
test('buyer_group_analyzer: a negated country gives no India section',async()=>{
 const t=await call({...BASE,target_company_size:'mid-sized private banks, not in India'});
 assert.ok(!t.includes('### India'));
});
test('buyer_group_analyzer: a company name never selects a region',async()=>{
 const t=await call({...BASE,company:'India Systems',target_company_size:'mid-sized private banks'});
 assert.ok(!t.includes('### India'));assert.ok(t.includes(QUESTION));
});
