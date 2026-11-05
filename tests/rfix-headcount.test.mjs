// M082: a denied, unknown or unconfirmed headcount is never a current count. Nine sectors, field specific customers, every country.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
import {REGION_DATA} from '../dist/regions.js';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url)));
const dd=cases.find(x=>x.tool==='icp_deep_dive'),ga=cases.find(x=>x.tool==='icp_gap_analysis');
const call=async(name,args)=>{const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));const b=await r.json();assert.ok(!b.error&&!b.result?.isError,JSON.stringify(b));return b.result.content.map(c=>c.text).join('\n');};
const has=(s,v)=>new RegExp('(^|[^0-9,])'+v+'(?![0-9,])').test(s);
const size=out=>(out.match(/### Likely Company Size[\s\S]*?(?=\n###)/)||[''])[0];
const customers=['freight forwarders','commercial banks','hotel groups','contact centre operators','IT services firms','mobile network operators','managed security providers','platform engineering teams','customer support teams'];
const countries=REGION_DATA.flatMap(r=>r.reader_hints.countries.map(c=>c.name==='Viet Nam'?'Vietnam':c.name));
let k=0;
for(const [vi,cust] of customers.entries())for(const [ci,C] of countries.entries()){
 if((vi+ci)%4)continue; // every sector meets every region; each country meets at least two sectors
 const n=300+((vi*31+ci)%7)*100,m=n+1000;
 test(`M082 ${cust} ${C}`,async()=>{
  const run=text=>call('icp_deep_dive',{...dd.args,customers:undefined,customer_descriptions:text});
  const exact=size(await run(`${cust} in ${C} with ${n} employees.`));
  assert.ok(exact.includes(`**${n} employees** (as you typed it)`),exact);
  assert.ok(size(await run(`${cust} in ${C} have ${n} staff.`)).includes(`${n} staff`));
  for(const text of [
   `These ${cust} in ${C} do not have ${n} employees. Their headcounts are unknown.`,
   `${cust} in ${C} don't have ${n} employees.`,
   `${cust} in ${C} may have about ${n} employees, but this is unconfirmed.`,
   `${cust} in ${C} have ${n} employees. That figure is unconfirmed.`,
   `The headcount of ${cust} in ${C} is unknown; one estimate says ${n} employees.`,
  ]){const s=size(await run(text));assert.ok(!has(s,n),text+' -> '+s);assert.ok(!/as you typed it/.test(s),text);}
  const mixed=size(await run(`${cust} in ${C} have ${m} employees. They do not have ${n} employees.`));
  assert.ok(mixed.includes(`${m} employees`),mixed);assert.ok(!has(mixed,n),mixed);
  const reversed=size(await run(`${cust} in ${C} do not have ${n} employees. They have ${m} employees.`));
  assert.ok(reversed.includes(`${m} employees`),reversed);assert.ok(!has(reversed,n),reversed);
  const gap=await call('icp_gap_analysis',{...ga.args,current_customers:`${cust} in ${C} do not have ${n} employees. Their headcounts are unknown.`,ideal_icp:`${cust} in ${C} with ${m} employees.`});
  assert.ok(!gap.split('\n').some(l=>/current/i.test(l)&&has(l,n)),gap);assert.ok(gap.includes(`${m} employees`),gap);
  assert.equal(await run(`${cust} in ${C} with ${n} employees.`),await run(`${cust} in ${C} with ${n} employees.`));
  k++;
 });
}
test('M082 matrix size',()=>assert.ok(k>=60));
