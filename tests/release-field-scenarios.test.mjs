import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const alpha=existsSync(new URL('../netlify/functions/mcp-sse.js',import.meta.url));
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
const bases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url)));
const tools=JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json',import.meta.url))).tools_list.tools;
const fields=s=>({
 product_category:s.product, product_description:s.product, your_product:s.product, your_solution:s.product, product:s.product, product_context:`${s.product}. ${s.pain}. Hypothesis: ${s.capability}.`, product_feature:s.product,
 company:'Synthetic field case',company_name:'Synthetic field case', product_name:'Synthetic field product', account_name:'Synthetic field account', customer_name:'Anonymous pilot customer', customer_company:'Anonymous field customer', deal_name:`${s.product} evaluation`,
 industry:s.id, sector:s.product, prospect_industry:s.audience, customer_industry:s.audience, target_industry:s.audience,
 target_customer:s.audience,target_company_type:s.audience,target_company_size:'500 to 2000 employees',target_segments:s.audience,customer_segment:s.audience,current_customers:`Three ${s.audience}`,ideal_icp:`${s.audience}, with ${s.buyer} as the buyer, who face ${s.pain}`,current_icp:s.audience,
 known_pain_points:s.pain,key_pain_points:s.pain,customer_challenges:s.pain,customer_pain:s.pain,problem_solved:s.pain,challenge:s.pain,specific_pain_point:s.pain,
 prospect_role:s.buyer,target_persona:s.buyer,primary_audience:s.buyer,target_audience:s.buyer,target_reader:s.buyer,customer_role:s.buyer,champion_role:s.buyer,buyer_champion:s.buyer,typical_champion:s.buyer,champion_name:'Pilot contact',target_stakeholder:'CFO',economic_buyer:'CFO: authority not confirmed',known_contacts:`${s.buyer}: sponsor; CFO: budget approval unconfirmed`,attendees:s.buyer,stakeholders_involved:s.buyer,
 key_benefit:s.capability,key_outcome:`Improve ${s.metric}`,unique_capability:s.capability,differentiation:`${s.capability}; not independently compared`,key_differentiators:s.capability,key_differentiation:s.capability,your_strengths:s.capability,value_props:s.capability,key_value_prop:s.capability,key_value_points:`${s.capability}. ${s.evidence}`,
 common_objections:s.objection,known_objections:s.objection,competitor_objections:s.objection,buyer_priorities:s.metric,buyer_persona:s.buyer,
 competitors:'Existing manual workflow; incumbent supplier',competitor:'Incumbent supplier',competitor_won:'Incumbent supplier',competitive_context:s.objection,competitor_context:'Incumbent supplier',competitor_weaknesses:`One buyer reports that ${s.pain}; not independently verified`,competitive_threats:s.objection,competitor_details:'No independent rival evidence',your_weaknesses:'Deployment capacity has not been checked',
 customer_metrics:s.evidence,proof_points:s.evidence,social_proof:s.evidence,results:s.evidence,success_story:`${s.evidence} Written publication permission has not been received.`,customer_quote:s.quote,customer_feedback:s.quote,interview_notes:`${s.buyer}: ${s.quote}. ${s.evidence}`,solution:s.capability,success_metrics:s.metric,known_metrics:`${s.evidence} CFO supplied annual labour cost: $240000; no headcount reduction approved.`,value_delivered:s.evidence,
 topic:`How to inspect ${s.metric}`,your_take:`${s.capability} needs an accountable owner and a measured baseline`,key_points:`${s.pain}. ${s.capability}. ${s.evidence}`,key_takeaways:`Name an owner; measure ${s.metric}; inspect one operating batch`,key_message:s.capability,
 content:`${s.product} addresses ${s.pain}. ${s.evidence} Ask the ${s.buyer} to inspect one batch.`,source_content:`${s.product} addresses ${s.pain}. ${s.evidence} Ask the ${s.buyer} to inspect one batch.`,
 current_positioning:`${s.product} for ${s.audience}`,positioning_statement:`${s.product} for ${s.audience} to ${s.capability}`,customer_need:s.pain,category:s.product,
 recent_wins:`One paid pilot after ${s.trigger}. ${s.evidence}`,recent_losses:`One deal deferred: ${s.objection}. Single observation, no trend.`,market_changes:`A buyer mentioned ${s.trigger}; no market-wide trend established`,time_period:'Q3 2026',success_correlation:`Hypothesis: ${s.trigger} precedes a purchase; validate on held-out deals`,
 goals:`Five paid pilot commitments. ${s.motion}`,partner_goals:`Three partners able to introduce ${s.audience}`,available_channels:'Founder outreach and customer referrals',existing_partners:'One introduction; no attributable closed revenue',launch_date:'2026-12-01',your_deal_size:'$24000 annual',deal_size:'$24000 annual',price_point:'$24000 annual',average_deal_size:'$24000 annual',sales_cycle:'90 days',
 potential_crises:`An outage blocks ${s.capability}. Impact remains unconfirmed.`,compliance_requirements:s.review,blockers:`${s.objection}. ${s.review}`,known_requirements:`Confirm ${s.metric} on one batch. ${s.review}`,known_process_steps:'Pilot acceptance, security review, procurement, signature',technical_evaluators:'Head of IT',procurement_contact:'Procurement manager',next_steps:`Confirm acceptance with ${s.buyer}`,close_date:'2026-12-18',target_close_date:'2026-12-18',
 current_process:s.pain,implementation_timeline:'Eight weeks',implementation_approach:s.motion,loss_reason:s.objection,deal_details:`One $48000 deal lost after 120 days. ${s.objection}. ${s.buyer} confirmed deferral; no trend established.`,
 current_products:s.product,expansion_opportunities:'Second operating team; needs unconfirmed',account_notes:`${s.buyer} has not introduced the budget owner. ${s.review}`,churn_reasons:s.objection,current_churn_rate:'3% monthly logo churn',available_data_signals:`Usage and ${s.metric}`,current_interventions:'Named owner review',
 document_content:`Product: ${s.product}\nAudience: ${s.audience}\nBuyer roles: ${s.buyer}\nGoal: win five paid pilots by 2026-12-18\nOwner: CMO\nBudget: $18000 and two sellers\nDeliverable: ${s.motion}\nReview: weekly\nMessage: ${s.capability}\nProof: ${s.evidence}`,intended_audience:'CEO and CRO',desired_outcome:'Decide whether five pilots fit our delivery capacity',gtm_challenge:`${s.product}. ${s.pain}. ${s.motion}`,current_channels:'Founder sales and customer referrals',business_stage:'Early revenue',
 cta_goal:`Ask readers to measure ${s.metric}`,call_to_action:'Reply with one operating example',desired_outcome_demo:`Agree a test for ${s.metric}`,goal:'Publish a defensible draft',audience:s.buyer,sender_context:'Founder writing to a potential buyer',relationship_context:'Pilot contact; approval not yet received',use_case:s.pain,incentive:'No incentive',author_background:'Practitioner; pilot evidence only',urgency_drivers:s.trigger,champion_wins:`A named owner for ${s.metric}`,budget_context:'Budget has not been approved',buyer_leverage:'Buyer can defer the decision',your_leverage:'Delivery scope can be reduced',decision_timeline:'Decision planned in December',approval_authority:'CFO approval required',competitor_price:'Incumbent renewal quote is $68000 a year',pricing:'$80000 annual; not approved',
 data_sources:'Synthetic account count supplied by the founder; no external verification',segment_name:s.audience,company_counts:`${s.audience}: 1800; adjacent segments unknown`,
});
function argsFor(c,s,schema){
 const a=structuredClone(c.args), values=fields(s);
 for(const [key,field] of Object.entries(schema.properties)) if(field.type==='string'&&!field.enum&&key in values) a[key]=values[key];
 if('business_model' in schema.properties && schema.properties.business_model.enum.includes(s.model)) a.business_model=s.model;
 if('your_sector' in schema.properties) {const v=s.id.replaceAll('-','_');if(schema.properties.your_sector.enum?.includes(v))a.your_sector=v;}
 if('industry' in schema.properties && schema.properties.industry.enum?.includes(s.id)) a.industry=s.id;
 switch(c.tool){
 case 'icp_deep_dive': a.customers=[1,2,3].map(i=>({name:`Synthetic account ${i}`,industry:s.audience,size:'500 employees',acv:24000,sales_cycle_days:75,tech_stack:['Existing workflow'],buying_trigger:s.trigger,champion_title:s.buyer}));break;
 case 'icp_scoring_model':a.scoring_criteria=[{criterion:s.metric,importance:'critical',values:['Measured baseline','No baseline']},{criterion:s.trigger,importance:'important',values:['Confirmed this quarter','No date']}];break;
 case 'buyer_group_analyzer':a.known_stakeholders=[s.buyer,'CFO','Head of IT'];break;
 case 'lookalike_signal_generator':a.champion_titles=[s.buyer];a.buying_triggers=[s.trigger];a.icp_firmographics={industries:[s.audience],company_sizes:['500 to 2000 employees']};break;
 case 'account_prioritization':a.accounts=[{name:`${s.buyer} account`,fit_score:90,intent_signals:30,relationship:20,timing:'later'},{name:'Second account',fit_score:55,intent_signals:85,relationship:80,timing:'now'}];break;
 case 'icp_interview_synthesizer':a.interview_notes=[1,2].map(i=>({customer:`Synthetic account ${i}`,role:s.buyer,pain_points:[s.pain],buying_triggers:[s.trigger],key_quotes:[s.quote],value_realized:[s.capability+'; impact unmeasured']}));break;
 case 'impact_anchor_market':a.potential_segments=[s.audience,'Adjacent buyer teams'];break;
 case 'impact_map_alternatives':case 'impact_full_audit':a.competitors=['Existing manual workflow','Incumbent supplier'];break;
 case 'pmf_scorecard':a.current_metrics='Assessment date: 2026-11-01; monthly logo churn: 2%; NPS: 35 from 12 replies; CAC: $18000; LTV: unknown; annual logo retention: 78%';a.customer_feedback=`${s.quote} ${s.evidence}`;break;
 }
 return a;
}
test('nine field fixtures use distinct products, buyer roles, metrics, motions and objections',()=>{
 assert.equal(facts.length,9);
 for(const key of ['product','buyer','metric','motion','objection'])assert.equal(new Set(facts.map(s=>s[key])).size,9,key);
});
for(const c of bases){
 const schema=tools.find(t=>t.name===c.tool).inputSchema;
 if(!Object.values(schema.properties).some(f=>f.type==='string'&&!f.enum))continue;
 for(const s of facts)test(`field facts ${s.id}: ${c.tool}`,async()=>{
  const args=argsFor(c,s,schema);
  const response=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:c.tool,arguments:args}})}));
  const message=await response.json();
  assert.ok(!message.error&&message.result&&!message.result.isError,JSON.stringify(message));
  const text=message.result.content.filter(v=>v.type==='text').map(v=>v.text).join('\n');
  assert.match(text,/## Reading the answer/);
  assert.doesNotMatch(text,/\bNaN\b|\[object Object\]|\bundefined\b/);
  // Assert concrete supplied field evidence and the tool's decision, rather
  // than accepting a sector label in a footer as proof of field adaptation.
  const expected={
   icp_deep_dive:[s.buyer,s.audience],icp_scoring_model:[s.metric,'Measured baseline'],buyer_group_analyzer:[s.buyer],tam_sam_som_calculator:['$360K'],lookalike_signal_generator:[s.buyer],account_prioritization:[`${s.buyer} account`],icp_gap_analysis:[s.buyer,s.pain],icp_evolution_tracker:[s.trigger],icp_interview_synthesizer:[s.pain],
   impact_get_framework:['IMPACT'],impact_identify_champions:[s.pain],impact_map_alternatives:[s.capability],impact_pinpoint_value:[s.metric],impact_anchor_market:[s.audience],impact_craft_message:[s.capability],impact_translate_execution:[s.audience],impact_full_audit:[s.pain],
   pmf_scorecard:['35','unknown'],launch_commander:[s.audience,'Five paid pilot commitments'],customer_interview_kit:[s.buyer],retention_playbook:[s.objection],partner_architect:[s.audience],crisis_planner:[s.capability],competitive_intel:[s.objection],craft_gtm_analyzer:['five paid pilots'],
   case_study_generator:[s.pain],newsletter_builder:[s.metric],webinar_script:[s.metric],content_repurposer:[s.metric],thought_leadership_series:[s.metric],testimonial_capture:[s.buyer],sales_enablement_content:[s.objection],craft_content_improver:[s.metric],
   account_plan_builder:[s.buyer],deal_strategy_coach:[s.objection],discovery_question_bank:[s.buyer],roi_business_case_builder:['$240,000'],mutual_action_plan_generator:[s.buyer],win_loss_analyzer:[s.objection],proposal_section_writer:[s.pain],email_sequence_generator:[s.buyer],demo_script_builder:[s.buyer],pricing_negotiation_guide:['same scope'],champion_enablement_kit:[s.buyer],competitive_trap_setter:[s.metric],gtm_consultation:[s.pain],epic_audit:['Synthetic field case'],
  }[c.tool];
  assert.ok(expected?.length,'tool needs explicit field assertions');
  const norm=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  for(const fact of expected)assert.ok(norm(text).includes(norm(fact)),`missing field fact: ${fact}`);
 });
}
