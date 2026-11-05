import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import handler from '../netlify/functions/mcp.mjs';
import {regionNotes,NO_REGION_SUFFIX} from '../src/region-reader.ts';
import {explainSector} from '../src/verticals.ts';
import {seedCases,verticalCases,regionCases,rpc} from './p1-regions-cases.mjs';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/p1-regions-no-region-baseline.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text=r=>r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
const stripSuffix=v=>typeof v==='string'?(v.endsWith(NO_REGION_SUFFIX)?v.slice(0,-NO_REGION_SUFFIX.length):v):Array.isArray(v)?v.map(stripSuffix):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,stripSuffix(x)])):v;
const removeQuestion=r=>stripSuffix({...r,content:r.content});
const suffix=t=>t.includes('## Region and industry context')?t.slice(t.indexOf('## Region and industry context')):'';
test('All tool names descriptions schemas annotations and lists stay unchanged',async()=>assert.deepEqual(await rpc(handler,'tools/list'),baseline.tool_list));
for(const row of baseline.rows)test('No region byte parity and three runs: '+row.tool+' '+row.vertical,async()=>{
 for(let i=0;i<3;i++){const result=await rpc(handler,'tools/call',{name:row.tool,arguments:row.args});assert.ok(text(result).endsWith(NO_REGION_SUFFIX));assert.equal(hash(removeQuestion(result)),row.sha256);}
});
for(const [vertical,product]of verticalCases)for(const [region,alias]of regionCases)test('Regional exact same meaning opposite and three runs: '+vertical+' '+region,async()=>{
 assert.equal(explainSector({seller:[product]}).vertical?.id,vertical);
 for(const c of seedCases){
  let first;
  for(const phrase of [`We sell in ${region}.`,`We sell in ${alias}.`]){
   const args={...c.args,product_category:product+'. '+phrase};
   const result=await rpc(handler,'tools/call',{name:c.tool,arguments:args});assert.ok(!result.isError,c.tool);
   const notes=suffix(text(result));assert.ok(notes,c.tool+' has notes');
   if(first)assert.equal(notes,first,c.tool+' equivalent region notes');else first=notes;
   for(let run=1;run<3;run++)assert.deepEqual(await rpc(handler,'tools/call',{name:c.tool,arguments:args}),result);
   first=notes;
  }
  const opposite={...c.args,product_category:product+`. We do not sell in ${region}.`};
  const result=await rpc(handler,'tools/call',{name:c.tool,arguments:opposite});assert.ok(!result.isError,c.tool);assert.equal(suffix(text(result)),'',c.tool+' opposite');
  // Scope equality is only within a tool. Other tools can have different supplied context.
  first=undefined;
 }
});
test('Required input refusals and software referrals never get region notes',async()=>{
 const missing=await rpc(handler,'tools/call',{name:'tam_sam_som_calculator',arguments:{product_category:'Fintech in India'}});assert.equal(missing.isError,true);assert.equal(suffix(text(missing)),'');
 const referral=await rpc(handler,'tools/call',{name:'icp_deep_dive',arguments:{product_category:'Recommend software for fintech banks in India'}});assert.equal(suffix(text(referral)),'');
});
test('Country notes are appended once and contain no caller markup',async()=>{
 const c=seedCases[0],args={...c.args,product_category:'Fintech in India <script>alert(1)</script>'};const result=await rpc(handler,'tools/call',{name:c.tool,arguments:args});assert.ok(!result.isError);const notes=suffix(text(result));assert.equal(notes.split('## Region and industry context').length,2);assert.doesNotMatch(notes,/<script>|alert\(1\)/);
});

test('India data is sourced and a named market is not borrowed from another country',async()=>{const c=seedCases.find(c=>c.tool==='icp_deep_dive');const result=await rpc(handler,'tools/call',{name:c.tool,arguments:{...c.args,product_category:'Fintech payment reconciliation software sold in India'}});assert.match(suffix(text(result)),/Reserve Bank of India/);assert.doesNotMatch(suffix(text(result)),/Financial Conduct Authority|Monetary Authority of Singapore/);});
