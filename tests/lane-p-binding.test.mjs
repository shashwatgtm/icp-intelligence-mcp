import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
const alpha=pkg.name.includes('gtm-alpha'),revenue=pkg.name.includes('revenue-enablement');
const baselineName=['icp-intelligence','impact-mcp','craft-gtm'].some(n=>pkg.name.includes(n))?'round5-reader-cases':'regions-baseline';
const baseline=JSON.parse(readFileSync(new URL(`./fixtures/${baselineName}.json`,import.meta.url)));
const seeds=Array.isArray(baseline)?baseline:baseline.cases;
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const fields={case_study_generator:'your_product',newsletter_builder:'your_product',webinar_script:'your_product',content_repurposer:'source_content',thought_leadership_series:'your_take',testimonial_capture:'your_product',sales_enablement_content:'product',craft_content_improver:'content',pmf_scorecard:'product',launch_commander:'product_feature',customer_interview_kit:'product_context',retention_playbook:'product',partner_architect:'product',crisis_planner:'potential_crises',competitive_intel:'your_product',craft_gtm_analyzer:'document_content',impact_get_framework:'sector',impact_identify_champions:'product_description',impact_map_alternatives:'your_product',impact_pinpoint_value:'category',impact_anchor_market:'product_description',impact_craft_message:'product_category',impact_translate_execution:'positioning_statement',impact_full_audit:'product_description'};
const rpc=async(tool,args)=>{const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));const b=await r.json();assert.ok(!b.error,JSON.stringify(b));assert.ok(!b.result?.isError,JSON.stringify(b));return b.result;};
const notes=r=>r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n').split('## Region and industry context')[1]||'';
for(const seed of seeds){
 if(seed.tool==='generate_roadmap')continue;
 const field=alpha?(seed.tool==='epic_audit'?'challenge':'gtm_challenge'):revenue?'your_solution':pkg.name.includes('icp-intelligence')?'product_category':fields[seed.tool];
 const args=text=>{const a={...seed.args,[field]:text};delete a.your_sector;if(alpha||seed.tool==='crisis_planner')a.industry='fintech';return a;};
 for(const [id,input,control,headings] of [
  ['M077 denied offering','We do not sell wealth management software in UAE. We sell payment gateway software in India.','We sell payment gateway software in India.',['India']],
  ['M077 reversed','We sell payment gateway software in India. We do not sell wealth management software in UAE.','We sell payment gateway software in India.',['India']],
  ['M097 inability','We sell lending software in India. We cannot sell in Singapore.','We sell lending software in India.',['India']],
  ['M098 denomination','We sell lending software in Singapore under contracts denominated in INR.','We sell lending software in Singapore.',['Southeast Asia · Singapore']],
  ['M098 account','We sell lending software in Singapore. We receive payments into our India bank account.','We sell lending software in Singapore.',['Southeast Asia · Singapore']],
  ['M099 membership','We sell lending software in the UK. The UK is not an EU member.','We sell lending software in the UK.',['UK · United Kingdom']],
 ])test(seed.tool+' '+id,async()=>{
  const first=await rpc(seed.tool,args(input)),expected=await rpc(seed.tool,args(control));
  assert.deepEqual([...notes(first).matchAll(/^### (.+)$/gm)].map(m=>m[1]),headings);
  assert.equal(notes(first),notes(expected));
  assert.deepEqual(await rpc(seed.tool,args(input)),first);assert.deepEqual(await rpc(seed.tool,args(input)),first);
 });
 test(seed.tool+' M078 separate offerings and country subtypes',async()=>{
  const input='We sell lending software in India. We sell managed SOC services in Singapore.';
  const a=args(input);if(seed.tool==='crisis_planner')delete a.industry;
  // Crisis requires one selected industry. Test its valid same-industry two-market case.
  if(alpha||seed.tool==='crisis_planner')a.industry='fintech',a[field]='We sell lending software in India. We sell wealth management software in Singapore.';
  const first=await rpc(seed.tool,a),text=notes(first);
  assert.match(text,/### India/);assert.match(text,/### Southeast Asia · Singapore/);
  const sg=text.split('### Southeast Asia · Singapore')[1];
  assert.doesNotMatch(sg,/licensed moneylenders fall under/);
  if(!alpha&&seed.tool!=='crisis_planner')assert.match(sg,/SOC|Security Operations|cybersecurity/i);
  assert.deepEqual(await rpc(seed.tool,a),first);assert.deepEqual(await rpc(seed.tool,a),first);
 });
}
