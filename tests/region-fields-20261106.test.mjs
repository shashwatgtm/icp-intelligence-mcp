// Region reader: a country named in free text must be read from the real tool fields, and a named place must never
// leave the "Which region applies" question behind. Uses real tool names and fields of this repository only.
// Run: node --no-warnings --test tests/region-fields-20261106.test.mjs  (after npm run build)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const packageName=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).name;
const alpha=packageName.includes('gtm-alpha');
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const {regionNotes,NO_REGION_SUFFIX}=await import(alpha?'../netlify/lib/region-reader.js':'../dist/region-reader.js');
const future=days=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);
const SOFT='Invoice automation software';
const ROI={your_solution:SOFT,primary_value_driver:'cost_reduction'};
const ICP={current_icp:'Mid-market logistics firms',product_category:'freight visibility software'};
const IMPACT={target_customer:'Operations leads at mid-size carriers',key_benefit:'Fewer late deliveries',differentiation:'Live tracking'};
const CRISIS={company:'A regional carrier',industry:'logistics_tech',customer_base:'b2b_enterprise',data_sensitivity:'low_general'};
const CASE={customer_name:'A mid-size carrier',your_product:'Freight visibility software'};
// For each repository: [tool, fixed valid arguments, free text field].
const ALL={
 'revenue-enablement-mcp':{
  india:[['discovery_question_bank',{framework:'meddpicc',your_solution:SOFT},'prospect_industry'],['roi_business_case_builder',ROI,'current_process'],['roi_business_case_builder',ROI,'known_metrics'],['proposal_section_writer',{section_type:'problem_statement',your_solution:SOFT},'customer_industry'],['mutual_action_plan_generator',{deal_name:'Regional deal',target_close_date:future(70),your_solution:SOFT},'known_process_steps'],['champion_enablement_kit',{asset_type:'executive_brief',your_solution:SOFT},'urgency_drivers']],
  us:[['discovery_question_bank',{framework:'meddpicc',your_solution:SOFT},'known_pain_points']],
  spain:[['roi_business_case_builder',ROI,'known_metrics']],
  mexico:[['proposal_section_writer',{section_type:'problem_statement',your_solution:SOFT},'customer_challenges']],
  net:['deal_strategy_coach',{deal_name:'Regional deal',deal_stage:'discovery'},'next_steps'],
 },
 'icp-intelligence-mcp':{
  india:[['icp_evolution_tracker',ICP,'market_changes']],
  us:[['icp_evolution_tracker',ICP,'market_changes']],
  spain:[['icp_evolution_tracker',ICP,'market_changes']],
  mexico:[['icp_evolution_tracker',ICP,'market_changes']],
  net:['icp_evolution_tracker',ICP,'time_period'],
 },
 'impact-mcp':{
  india:[['impact_anchor_market',{product_description:'Freight visibility software for carriers'},'customer_pain'],['impact_craft_message',IMPACT,'customer_need']],
  us:[['impact_craft_message',IMPACT,'customer_need']],
  spain:[['impact_pinpoint_value',{target_customer:IMPACT.target_customer,unique_capability:'Live tracking'},'key_outcome']],
  mexico:[['impact_anchor_market',{product_description:'Freight visibility software for carriers'},'customer_pain']],
  net:['impact_anchor_market',{product_description:'Freight visibility software for carriers'},'sales_cycle'],
 },
 'craft-gtm-mcp':{
  india:[['pmf_scorecard',{product:'Freight visibility software',target_market:'logistics_tech'},'current_metrics'],['crisis_planner',CRISIS,'compliance_requirements']],
  us:[['crisis_planner',CRISIS,'compliance_requirements']],
  spain:[['launch_commander',{product_feature:'Live shipment tracking',launch_type:'feature_launch',target_segments:'mid-size carriers'},'goals']],
  mexico:[['pmf_scorecard',{product:'Freight visibility software',target_market:'logistics_tech'},'current_metrics']],
  net:['customer_interview_kit',{interview_type:'discovery',product_context:'Freight visibility software',target_persona:'Operations lead'},'key_hypotheses'],
 },
 'craft-content-mcp':{
  india:[['case_study_generator',CASE,'customer_industry'],['case_study_generator',CASE,'challenge']],
  us:[['case_study_generator',CASE,'challenge']],
  spain:[['case_study_generator',{...CASE,mode:'full',challenge:'Late deliveries',solution:'Live tracking'},'results']],
  mexico:[['case_study_generator',CASE,'customer_industry']],
  net:['newsletter_builder',{topic:'Carrier tracking',cta_goal:'register for the webinar'},'key_points'],
 },
 'gtm-alpha-secure':{
  india:[['gtm_consultation',{},'gtm_challenge'],['epic_audit',{},'challenge']],
  us:[['epic_audit',{},'challenge']],
  spain:[['gtm_consultation',{},'gtm_challenge']],
  mexico:[['epic_audit',{},'challenge']],
  net:['gtm_consultation',{gtm_challenge:'Pipeline is thin'},'current_channels'],
 },
};
const CASES=ALL[alpha?'gtm-alpha-secure':packageName.replace(/^@[^/]+\//,'')];
assert.ok(CASES,'no cases for '+packageName);
const QUESTION='Region context: Which region applies';
const call=async(tool,args)=>{
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));
 const j=await r.json();assert.ok(j.result&&j.result.content,JSON.stringify(j).slice(0,300));assert.ok(!j.result.isError,j.result.content[0].text.slice(0,300));
 return j.result.content.map(c=>c.text).join('\n');
};
// The alpha challenge fields need a first sentence that is not about a place, so the rest is free text.
const withText=(base,field,text)=>({...base,[field]:alpha?`Our sales pipeline is thin. ${text}.`:text});
for(const [tool,base,field] of CASES.india)test(`${tool} ${field}: "in India" gives an India section and no question`,async()=>{
 const t=await call(tool,withText(base,field,'Mid-market manufacturers in India'));
 assert.ok(t.includes('### India'),t.slice(-600));assert.ok(!t.includes(QUESTION));
});
for(const [tool,base,field] of CASES.us)test(`${tool} ${field}: "United States" gives North America`,async()=>{
 const t=await call(tool,withText(base,field,'Rollout across sites in the United States'));
 assert.ok(t.includes('### North America'),t.slice(-600));assert.ok(!t.includes(QUESTION));
});
for(const [tool,base,field] of CASES.spain)test(`${tool} ${field}: "Spain" gives Western Europe and Spain`,async()=>{
 const t=await call(tool,withText(base,field,'Close cycle of 9 days, target 4 days for the Spain team'));
 assert.ok(t.includes('### Western Europe · Spain'),t.slice(-600));assert.ok(!t.includes(QUESTION));
});
for(const [tool,base,field] of CASES.mexico)test(`${tool} ${field}: "Mexico" gives the outside-regions line and no question`,async()=>{
 const t=await call(tool,withText(base,field,'Plants in Mexico'));
 assert.ok(t.includes('### Mexico')&&t.includes('outside the regions we cover today'),t.slice(-600));assert.ok(!t.includes(QUESTION));
});
for(const [tool,base,field] of CASES.india.slice(0,1))test(`${tool} ${field}: "not in India" gives no India section`,async()=>{
 const t=await call(tool,withText(base,field,'Our prospects are not in India'));
 assert.ok(!t.includes('### India'),t.slice(-600));
});
for(const [tool,base,field] of CASES.india.slice(0,1))test(`${tool} ${field}: no country anywhere still gives the question`,async()=>{
 const t=await call(tool,withText(base,field,'Mid-market manufacturers'));
 assert.ok(t.endsWith(NO_REGION_SUFFIX),t.slice(-400));assert.ok(!t.includes('## Region and industry context'));
});
test('Safety net: a named country in any supplied free text field removes the question and gives that region',()=>{
 const [,base,field]=CASES.net;
 const india=regionNotes({...base,[field]:'Rollout next quarter in India'});
 assert.ok(india.includes('### India')&&!india.includes(QUESTION),india.slice(0,300));
 const us=regionNotes({...base,[field]:'Rollout next quarter in the United States'});
 assert.ok(us.includes('### North America')&&!us.includes(QUESTION),us.slice(0,300));
 // Claims and proof list offices and partners: they remove the question but never create a market.
 assert.equal(regionNotes({...base,strengths:'Offices in India and Germany',differentiators:'Customers in Canada'}),'');
});
test('Safety net respects negation, tentative wording and ignored keys',()=>{
 const [,base,field]=CASES.net;
 for(const text of ['Not in India','We exited India last year','We may enter India','Should we sell in India?'])assert.equal(regionNotes({...base,[field]:text}),NO_REGION_SUFFIX,text);
 assert.equal(regionNotes({...base,company:'India Systems',competitors:['Germany'],customer_quote:'We sell in Canada',customer_name:'Canada Freight'}),NO_REGION_SUFFIX);
 assert.equal(regionNotes({...base,[field]:'Rollout next quarter'}),NO_REGION_SUFFIX);
});
test('Deal context never overrides a market the seller named',()=>{
 const [,base,field]=CASES.net;
 const out=regionNotes({...base,product_description:'Freight visibility software sold in Germany',[field]:'Prospect plants in India'});
 assert.ok(out.includes('### Western Europe')&&!out.includes('### India'));
});
