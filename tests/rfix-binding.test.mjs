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
  ['RFIX M108 headquarters only','Our headquarters is in Singapore. We sell lending software in India.','We sell lending software in India.',['India']],
  ['RFIX M108 vendor identity','We are a Singapore vendor. We sell lending software in India. We do not sell lending software to a London bank.','We sell lending software in India.',['India']],
  ['RFIX M078 market first','In Singapore we sell cybersecurity software; in India we sell lending software.','In India we sell lending software; in Singapore we sell cybersecurity software.',['India','Southeast Asia · Singapore']],
  ['RFIX M098 Singapore dollars','We sell lending software in India and invoice in Singapore dollars.','We sell lending software in India.',['India']],
  ['RFIX M098 denied market, currency only','We do not sell lending software in India and invoice in Singapore dollars.','We do not sell lending software in India.',[]],
  ['RFIX M097 unable','We are unable to sell lending software in India. We sell lending software in Singapore.','We sell lending software in Singapore.',['Southeast Asia · Singapore']],
  ['RFIX M106 payment received in','We receive payment in an India bank account and sell lending software in Singapore.','We sell lending software in Singapore.',['Southeast Asia · Singapore']],
  ['RFIX M107 same country other product denied','We sell lending software in India but do not sell payment gateway software in India.','We sell lending software in India.',['India']],
  ['RFIX M077 warehouse','We sell warehouse management software to warehouse operators in Singapore, but do not sell lending software in India.','We sell warehouse management software to warehouse operators in Singapore.',['Southeast Asia · Singapore']],
 ])test(seed.tool+' '+id,async()=>{
  const first=await rpc(seed.tool,args(input)),expected=await rpc(seed.tool,args(control));
  assert.deepEqual([...notes(first).matchAll(/^### (.+)$/gm)].map(m=>m[1]),headings);
  assert.equal(notes(first),notes(expected));
  assert.deepEqual(await rpc(seed.tool,args(input)),first);assert.deepEqual(await rpc(seed.tool,args(input)),first);
 });
}
