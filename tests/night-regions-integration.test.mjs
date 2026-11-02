import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import handler from '../netlify/functions/mcp.mjs';
import {regionNotes} from '../src/region-reader.ts';
import {explainSector} from '../src/verticals.ts';
import {seedCases,verticalCases,regionCases,rpc} from './night-regions-cases.mjs';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/night-regions-no-region-baseline.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text=r=>r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
const suffix=t=>t.includes('## Region notes (draft for owner review)')?t.slice(t.indexOf('## Region notes (draft for owner review)')):'';
test('All tool names descriptions schemas annotations and lists stay unchanged',async()=>assert.deepEqual(await rpc(handler,'tools/list'),baseline.tool_list));
for(const row of baseline.rows)test('No region byte parity and three runs: '+row.tool+' '+row.vertical,async()=>{
 for(let i=0;i<3;i++)assert.equal(hash(await rpc(handler,'tools/call',{name:row.tool,arguments:row.args})),row.sha256);
});
for(const [vertical,product]of verticalCases)for(const [region,alias]of regionCases)test('Regional exact same meaning opposite and three runs: '+vertical+' '+region,async()=>{
 assert.equal(explainSector({seller:[product]}).vertical?.id,vertical);
 for(const c of seedCases){
  let first;
  for(const phrase of [`We serve buyers in ${region}.`,`Our customers operate in ${alias}.`]){
   const args={...c.args,product_category:product+'. '+phrase};
   const result=await rpc(handler,'tools/call',{name:c.tool,arguments:args});assert.ok(!result.isError,c.tool);
   const notes=suffix(text(result));assert.ok(notes,c.tool+' has notes');
   if(first)assert.equal(notes,first,c.tool+' equivalent region notes');else first=notes;
   for(let run=1;run<3;run++)assert.deepEqual(await rpc(handler,'tools/call',{name:c.tool,arguments:args}),result);
   first=notes;
  }
  const opposite={...c.args,product_category:product+`. We do not serve buyers in ${region}.`};
  const result=await rpc(handler,'tools/call',{name:c.tool,arguments:opposite});assert.ok(!result.isError,c.tool);assert.equal(suffix(text(result)),'',c.tool+' opposite');
  // Scope equality is only within a tool. Other tools can have different supplied context.
  first=undefined;
 }
});
test('Fintech India and Germany full Deep Dive outputs use different scoped evidence',async()=>{
 const fixture=seedCases.find(c=>c.tool==='icp_deep_dive');
 const outputs={};
 for(const country of ['India','Germany']){
 const args={...fixture.args,product_category:'Fintech payment reconciliation for banks in '+country};
 const result=await rpc(handler,'tools/call',{name:fixture.tool,arguments:args});assert.ok(!result.isError);outputs[country]=text(result);
 for(let run=1;run<3;run++)assert.deepEqual(await rpc(handler,'tools/call',{name:fixture.tool,arguments:args}),result);
 }
 assert.match(suffix(outputs.India),/Reserve Bank of India/);assert.match(suffix(outputs.Germany),/DORA/);
 assert.doesNotMatch(suffix(outputs.India),/DORA/);assert.doesNotMatch(suffix(outputs.Germany),/Reserve Bank of India/);
 if(process.env.REGION_EXAMPLE_DIR)for(const [country,output]of Object.entries(outputs))writeFileSync(process.env.REGION_EXAMPLE_DIR+'/'+country.toLowerCase()+'-fintech.md',output+'\n');
});
test('Required input refusals and software referrals never get region notes',async()=>{
 const missing=await rpc(handler,'tools/call',{name:'tam_sam_som_calculator',arguments:{product_category:'Fintech in India'}});assert.equal(missing.isError,true);assert.equal(suffix(text(missing)),'');
 const referral=await rpc(handler,'tools/call',{name:'icp_deep_dive',arguments:{product_category:'Recommend software for fintech banks in India'}});assert.equal(suffix(text(referral)),'');
});
test('Country notes are appended once and contain no caller markup',async()=>{
 const c=seedCases[0],args={...c.args,product_category:'Fintech in India <script>alert(1)</script>'};const result=await rpc(handler,'tools/call',{name:c.tool,arguments:args});assert.ok(!result.isError);const notes=suffix(text(result));assert.equal(notes.split('## Region notes').length,2);assert.doesNotMatch(notes,/<script>|alert\(1\)/);
});
