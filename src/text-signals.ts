/** Canonical deterministic clause reader. Generated copies must not be edited.
 * A match is evidence of a stated fact, never independent evidence that it is true.
 */
export type SignalState = 'affirmed' | 'negated' | 'unclear' | 'absent';
export interface SignalReading { state: SignalState; evidence: string[]; matched: string[] }
export const SIGNALS: Record<string, RegExp> = {
  'a named role, title or team': /\b(?:head of (?:growth|revenue|marketing|sales|operations|security)|person in charge|business lead)\b/i,
  'an owner or responsible party': /\b(?:accountable for|answerable for|takes responsibility|person in charge)\b/i,
  'a KPI, metric or goal': /\b(?:we aim to|we intend to achieve|success means|we will measure)\b/i,
  'a deliverable or output': /\b(?:put together|roll out|bring to market|make available)\b/i,
  'a named document or tool': /\b(?:written instructions|step by step instructions|single source of figures)\b/i,
  'a campaign or content asset': /\b(?:sales slides|buyer education material|outreach sequence)\b/i,
  'a channel asset': /\b(?:online seminar|virtual seminar|product page)\b/i,
  'an audience, persona or segment': /\b(?:people we sell to|firms we serve|who this is for)\b/i,
  'constraints or assumptions': /\b(?:must stay within|cannot exceed|working assumption|we assume)\b/i,
  'a budget or resources': /\b(?:money set aside|funds allocated|people available)\b/i,
  'context or current state': /\b(?:where we are today|as things stand|today we)\b/i,
  'a quarter or financial year': /\b(?:first|second|third|fourth) quarter(?: of)?(?: 20\d{2})?\b/i,
  'a duration with a number': /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve) (?:days?|weeks?|months?|years?)\b(?! at a time)/i,
  specificity: /\b(?:employees|revenue|Series|staff|annual sales|funding round)\b/i,
  education: /\b(?:educate|inform|teach|explain how|help .* understand)\b/i,
  awareness: /\b(?:awareness|brand|become known|more people know)\b/i,
  trust: /\b(?:trust|credibility|earn confidence|be believed)\b/i,
  ask: /\b(?:get in touch|write back|take a look|give it a try)\b/i,
  engaged: /\b(?:engaged|participates? in (?:the )?(?:decision|evaluation)|attends? (?:our |the )?(?:decision|evaluation|review) meetings?|actively involved|working with us on the decision)\b/i,
  incumbent: /\b(?:incumbent|already (?:use|uses|using|have|has) (?:a |the )?(?:rival|competitor|supplier|provider|vendor)|current (?:supplier|provider|vendor)|existing (?:supplier|provider|vendor))\b/i,
  blocker: /\b(?:blockers?|blocked|cannot proceed|can't proceed|held up|stalled|waiting for (?:budget|approval)|approval pending|budget (?:approval )?pending|stands? in the way|obstacles?|barriers?)\b/i,
  cancelled: /\b(?:cancelled|canceled|terminated|called off|abandoned|will not proceed|won't proceed|asked for a refund|requested a refund|ended the contract)\b/i,
  company_claim: /\b(?:offices?|locations?|headquartered|based in|founded|established|partners?|recognized|recognised|ranked|rated|listed|named|positioned|certified|accredited|judged (?:best|a leader))\b/i,
  recognition: /\b(?:industry analysts? (?:consider|regard|rate|place)|analysts? (?:placed|ranked|rated|selected)|front[- ]runner|top[- ]rated|judged (?:best|top)|recognition|award\w*|gartner|forrester|magic quadrant|named (?:a )?leader)\b/i,
  unique: /\b(?:no other (?:vendor|platform|supplier)|one[- ]of[- ]a[- ]kind|first and only|the only|unique|unrivalled|unrivaled|nothing else (?:can|does))\b/i,
  enterprise: /\b(?:enterprise|very large (?:corporate|companies|groups)|global corporations?|fortune 500|large corporate groups|big banks)\b/i,
  small: /\b(?:small|smb|tiny|under 50 (?:staff|employees)|fewer than 50 (?:staff|employees)|small businesses)\b/i,
  midmarket: /\b(?:mid[- ]market|mid[- ]size|medium[- ]sized)\b/i,
  finance: /\b(?:finance|fintech|financial|banks?|lenders?|people who keep our books|close each period|chief financial officer)\b/i,
  price: /\b(?:price|costs?(?! codes?\b)|expensive|budget|fees?|discount\w*|more money than (?:we|they) planned|paying more than .*worth|cannot afford|can't afford|too much money|spending ceiling)\b/i,
  offline: /\b(?:offline|lose coverage|lose signal|without (?:a )?(?:mobile )?(?:network|internet|signal)|no (?:internet|network|signal|connectivity)|poor network|remote areas?)\b/i,
  security: /\b(?:security|privacy|data protection|breach|hacked|records? leak(?:ed)?|records? .*public|unauthori[sz]ed access|attackers? (?:accessed|stole)|data (?:leak|stolen))\b/i,
  adoption: /\b(?:adoption|usage|not using|stopped using|rarely open|never log in|logins?|sits? unused|shelfware)\b/i,
  champion: /\b(?:champion|internal advocate|sponsor|person driving the purchase)\b/i,
  departed: /\b(?:champion left|sponsor left|key contact left|champion departed|sponsor departed|advocate resigned|contact resigned)\b/i,
  positive_result: /\b(?:improv\w*|saved?|reduc\w*|cut|cuts|faster|fewer|a fifth of the time|half the time|time fell|costs? fell|collections (?:rose|grew)|revenue (?:rose|grew))\b/i,
  adverse_result: /\b(?:(?:costs?|errors?|delays?|churn|losses?|tickets?) (?:rose|grew|increased|doubled)|(?:revenue|collections|retention|sales) (?:fell|dropped|declined)|lost money|worse than before|results worsened|asked for (?:their |the )?money back|no (?:customer|client|user).*improvement|cancelled|canceled|refund)\b/i,
  team_finance: /\b(?:people who keep our books|close each period|match payments to bills)\b/i,
  team_security: /\b(?:people who guard our systems|defend against intrusions|protect our records from attackers)\b/i,
  team_sales: /\b(?:people who win new accounts|people who carry a quota|turn prospects into paying customers)\b/i,
  team_customer: /\b(?:customer support|customer success|people who answer customer questions|help existing customers succeed|keep customers from leaving)\b/i,
  team_marketing: /\b(?:people who generate demand|bring buyers to our site|build awareness of our offer)\b/i,
  team_engineering: /\b(?:programmers who build|people who write code|people who ship releases)\b/i,
  team_api: /\b(?:programmers who build integrations|connect systems through endpoints)\b/i,
  team_modernization: /\b(?:replace the old stack|retire ageing systems|move off legacy applications)\b/i,
  team_it: /\b(?:people who run our internal systems|keep the network running|look after our computers)\b/i,
  team_operations: /\b(?:people who run daily delivery|keep work moving across teams|run the day to day process)\b/i,
  team_workplace: /\b(?:people who handle employee requests|help staff with internal tools)\b/i,
  team_people: /\b(?:people who recruit and develop staff|look after employee wellbeing)\b/i,
  team_risk: /\b(?:people who assess exposure|keep us within regulatory limits)\b/i,
  annual_period: /\b(?:over|in|during) (?:twelve|12) months\b|\b(?:over|in) (?:one|a|1) year\b/i,
  monthly_period: /\b(?:over|in|during) (?:one|a|1) month\b|every (?:thirty|30) days/i,
  quarterly_period: /\b(?:over|in|during) (?:three|3) months\b/i,
  bundle: /\b(?:one supplier for everything|single provider for the whole stack|put all .* under one contract)\b/i,
  feature: /\b(?:does not do what we need|cannot do the required job|key function is absent)\b/i,
  service: /\b(?:keeps going down|takes days to restore|promised availability was missed)\b/i,
  support: /\b(?:nobody answers when we ask|we cannot reach anyone|waiting days for an answer)\b/i,
  funding: /\b(?:fresh capital|new capital|closed a round|secured financing|backers invested)\b/i,
  migration: /\b(?:move to a new system|retire the old system|replace the old stack|switch platforms)\b/i,
  growth: /\b(?:opening more locations|entering another country|doubling the team|adding more capacity)\b/i,
  shortfall: /\b(?:falling behind plan|missed expectations|money is running out|service has become unreliable)\b/i,
  hiring: /\b(?:hired|appointed|new (?:cfo|ceo|ciso|cto)|joined as|took over as|became (?:the )?(?:head|chief|director))\b/i,
  timing: /\b(?:timing|priority|later|on hold|postponed|deferred|until (?:their|our) finances recover|next year|not now)\b/i,
  leaky: /\b(?:pipeline|new logos?|acquisition|top of funnel|more leads|more deals from new accounts|win new customers|bring in new customers)\b/i,
  ai_search: /\b(?:organic traffic dropping|ai search|zero click|chatgpt traffic|buyers .*answers from chatgpt|seo leads collapsed|search clicks fell)\b/i,
  upmarket: /\b(?:enterprise|upmarket|move up|moving to larger accounts|selling to big banks|fortune 500 buyers)\b/i,
};
const normalized=(text:string)=>text.replace(/&#(?:0*39|x0*27);|&apos;|[’‘]/gi,"'").replace(/[–—]/g,'-');
export function clauses(text: string): string[] {
  return String(text??'').replace(/\\([;.!?])/g, '$1').replace(/\b(Sr|Jr|Dr|Mr|Mrs|Ms|Prof|Inc|Ltd|vs)\./gi, '$1\u2024').split(/(?:[;\n!?]+|(?<!\d)\.(?!\d)|\b(?:but|however|whereas|yet now)\b|,?\s+and\s+(?=(?:we|they|it\s+(?:is|was|has|does)|our|their|the issue|the problem)\b))/i).map(s=>s.trim().replace(/\u2024/g,'.')).filter(Boolean);
}
function denied(clause:string,index:number,match:string):boolean {
 const before=clause.slice(0,index),after=clause.slice(index+match.length);
 // Negation that is part of a rule's exact phrase has that phrase's own meaning (not using, no signal).
 const left=(before.split(/[,:(]/).pop()??before).replace(/\bwhy not\b/gi, 'why');
 if (/\b(?:not|never|no|without|neither|nor|isn't|aren't|wasn't|weren't|don't|doesn't|didn't|cannot|can't|won't)\b(?:\W+\w+){0,6}\W*$/i.test(left.replace(/\bnot only\b/gi,''))) return true;
 if (/\bnon-\s*$/i.test(before))return true;
 if (/^\s*(?:(?:is|are|was|were|has|have|does|do)\s+)?(?:not|never|isn't|aren't|wasn't|weren't)\b/i.test(after))return true;
 if (/^\s*(?:is|are)\s+(?:fine|healthy|not (?:an? )?(?:issue|problem|concern)|no (?:issue|problem|concern))/i.test(after))return true;
 if (/^\s*(?:is|are)?\s*not for us\b/i.test(after))return true;
 if (/^\s*(?:nothing|no one|nobody)\b/i.test(after))return true;
 if (/\b(?:we (?:avoid|reject|deny)|do not claim|not claiming)\b/i.test(before))return true;
 return false;
}
export function readSignal(text: string, floor: RegExp, additional?: RegExp): SignalReading {
 const affirmed:string[]=[],negative:string[]=[],unclear:string[]=[],matched:string[]=[];
 for(const original of clauses(text)) {
  const c=normalized(original);
  for(const re of [floor,additional].filter(Boolean) as RegExp[]) {
   const flags=[...new Set((re.flags.replace(/[gy]/g,'')+'gi').split(''))].join('');
   for(const m of c.matchAll(new RegExp(re.source,flags))) {
    if(!m[0])continue;
    const at=m.index??0; const suffix=/^[a-z0-9_]*/i.exec(c.slice(at+m[0].length))?.[0]||'';
    if(denied(c,at,m[0]+(/[a-z0-9_]$/i.test(m[0])?suffix:'')))negative.push(original);
    else if(/\b(?:maybe|perhaps|might|unclear|not sure|not confirmed|hypothetically|if we|if they)\b/i.test(c))unclear.push(original);
    else {affirmed.push(original);matched.push(m[0]);}
   }
  }
 }
 const state:SignalState=affirmed.length&&negative.length?'unclear':affirmed.length?'affirmed':unclear.length?'unclear':negative.length?'negated':'absent';
 return {state,evidence:[...new Set([...affirmed,...negative,...unclear])],matched:[...new Set(matched)]};
}
export function hasSignal(text:string,floor:RegExp,kind?:string):boolean{return readSignal(text,floor,kind?SIGNALS[kind]:undefined).state==='affirmed'}
export function signal(text:string,kind:string):SignalReading {
 if(kind==='adverse_result')return adverseResult(text);
 return readSignal(text,SIGNALS[kind]??/(?!)/);
}
/** A refund approval workflow is a product capability, not a refund requested by a dissatisfied customer. */
export function adverseResult(text:string):SignalReading {
 const floor=SIGNALS.adverse_result;
 const readings=clauses(text).map(c=>{
  const workflow=/\b(?:approv(?:e|es|al)|authori[sz](?:e|es|ation))\s+(?:(?:of|for)\s+)?(?:every|each|all)\s+refunds?\b/i.test(c);
  return readSignal(c,workflow?new RegExp(floor.source.replace('|refund)',')'),floor.flags):floor);
 });
 const states=readings.map(r=>r.state),positive=states.includes('affirmed'),negative=states.includes('negated');
 return {state:positive&&negative?'unclear':positive?'affirmed':states.includes('unclear')?'unclear':negative?'negated':'absent', evidence:readings.flatMap(r=>r.evidence),matched:readings.flatMap(r=>r.matched)};
}
export function evidenceLine(label:string,reading:SignalReading):string{return `${label}: ${reading.state==='affirmed'?'stated':reading.state==='negated'?'negated':'fact was not clear'}${reading.evidence.length?`; read "${reading.evidence.join('"; "')}"`:''}.`}

export function confirmedMatches(text:string, floor:RegExp, additional?:RegExp):string[]{const r=readSignal(text,floor,additional);return r.state==='affirmed'?r.matched:[]}

/** Timing is a stated buying horizon. Contradictory or denied horizons stay at the documented unknown score. */
export function timingFact(text:string):{score:number;state:SignalState;evidence:string[]} {
 const groups:[number,RegExp][]=[
  [100,/\b(?:now|immediately|ready to (?:buy|start)|this week|without delay|as soon as possible)\b/i],
  [70,/\b(?:soon|shortly|in the next few weeks|within (?:a|one) month)\b/i],
  [40,/\b(?:later|next year|next quarter|postponed|deferred|not until next year)\b/i]
 ];
 const reads=groups.map(([score,re])=>({score,...readSignal(text,re)}));const positive=reads.filter(r=>r.state==='affirmed');
 return positive.length===1?{score:positive[0].score,state:'affirmed',evidence:positive[0].evidence}:{score:50,state:reads.some(r=>r.state!=='absent')?'unclear':'absent',evidence:[...new Set(reads.flatMap(r=>r.evidence))]};
}

export function correlationFact(text:string):'positive'|'negative'|'unknown' {
 const bad=readSignal(text,/\b(?:negative correlation|negatively correlated|correlat\w* negatively|lower win rate|higher churn|win rate (?:fell|dropped|declined)|lost (?:every|all|most)|lose more|lost more|close more slowly|longer sales cycle)\b/i);
 const good=readSignal(text,/\b(?:positive correlation|positively correlated|correlat\w* positively|higher win rate|lower churn|win rate (?:rose|grew|improved)|close\w* (?:\w+ ){0,4}faster|renew\w* (?:more|most)|win more|won more)\b/i);
 return bad.state==='affirmed'&&good.state!=='affirmed'?'negative':good.state==='affirmed'&&bad.state!=='affirmed'?'positive':'unknown';
}

export const SECTOR_LABELS:Record<string,string>={'logistics-tech':'Logistics tech',fintech:'Fintech',saas:'SaaS','vertical-saas':'Vertical SaaS','ai-native':'AI native',ites:'ITeS',telecom:'Telecom',software:'Software',cybersecurity:'Cybersecurity',other:'other (neutral B2B)'};
/** An explicit trade label before a buyer marker names the vendor. Feature words and buyer names do not. */
export function sellerSectorLabel(text:string):{id:string|null,evidence:string,state:SignalState} {
 const head=String(text||'').split(/\b(?:for|serving|serves|sold to|selling to|whose customers|our customers)\b/i)[0].trim();
 const patterns:[string,RegExp][]=[['vertical-saas',/\bvertical[- _]saas\b/i],['logistics-tech',/\blogistics[- _](?:tech|technology)\b/i],['ai-native',/\bai[- _]native\b/i],['cybersecurity',/\bcybersecurity\b/i],['fintech',/\bfintech\b/i],['ites',/\b(?:ites|it services)\b/i],['telecom',/\btelecom\b/i],['saas',/\bsaas\b/i],['software',/\bsoftware\b/i]];
 const hits=patterns.filter(([id,re])=>re.test(head)&&!(id==='saas'&&/vertical[- _]saas/i.test(head))).map(([id,re])=>({id,r:readSignal(head,re)}));
 const named=hits.filter(x=>x.r.state==='affirmed'&&new RegExp('(?:^|[\\n;.]\\s*)(?:(?:we are|our company is|a|an|the)\\s+)*'+patterns.find(p=>p[0]===x.id)![1].source.replace(/^\\b|\\b$/g,'')+'(?:\\s+(?:vendor|company|firm|business|provider|platform|product|software|tools?|solutions?))?(?:\\s+(?:building|protecting|delivering|providing)\\b[^.;]*)?[.!]?$','i').test(head));
 // A broad software word beside a specific label is a product noun, not a competing sector.
 const specific=named.filter(x=>!['software','saas'].includes(x.id));const candidates=specific.length?specific:named;
 return candidates.length===1?{id:candidates[0].id,evidence:head,state:'affirmed'}:{id:null,evidence:head,state:hits.length&&hits.every(x=>x.r.state==='negated')?'negated':hits.some(x=>x.r.state!=='absent')?'unclear':'absent'};
}
export function sectorChoiceNotice(tool:string,args:Record<string,unknown>,infer:(text:string)=>{id?:string;name?:string;source?:string|null}):string {
 const fields:Record<string,string[]>=SECTOR_TOOL_FIELDS;
 const chosen=typeof args.your_sector==='string'?args.your_sector.replace(/_/g,'-'):GTM_INDUSTRY_TOOLS.includes(tool)&&typeof args.industry==='string'?args.industry.replace(/_/g,'-'):null;
 if(!chosen||!SECTOR_LABELS[chosen])return '';
 const texts=(fields[tool]||[]).map(f=>args[f]).filter((v):v is string=>typeof v==='string'&&!!v.trim());
 for(const text of texts){const label=sellerSectorLabel(text),r=infer(text);const id=label.id||(label.state!=='negated'&&r.source==='seller'?r.id:null);if(id&&id!==chosen)return `**Sector conflict:** You selected ${SECTOR_LABELS[chosen]}, but the description reads as ${SECTOR_LABELS[id]||r.name||id}. The selected ${SECTOR_LABELS[chosen]} is used. Sentence read: "${text}".\n\n`;}
 return '';
}

const SECTOR_TOOL_FIELDS:Record<string,string[]>={"icp_deep_dive": ["product_category"], "icp_scoring_model": ["product_category"], "buyer_group_analyzer": ["product_category"], "tam_sam_som_calculator": ["product_category"], "icp_gap_analysis": ["product_category"], "icp_evolution_tracker": ["product_category"], "icp_interview_synthesizer": ["product_category"], "lookalike_signal_generator": ["product_category"], "account_prioritization": ["product_category"], "impact_get_framework": ["sector"], "impact_identify_champions": ["product_description"], "impact_map_alternatives": ["category"], "impact_pinpoint_value": ["category"], "impact_anchor_market": ["product_description"], "impact_craft_message": ["product_category"], "impact_translate_execution": ["positioning_statement"], "impact_full_audit": ["product_description"], "pmf_scorecard": ["product"], "launch_commander": ["product_feature"], "customer_interview_kit": ["product_context"], "retention_playbook": ["product"], "partner_architect": ["product"], "crisis_planner": ["company"], "competitive_intel": ["your_product"], "craft_gtm_analyzer": ["document_content"], "case_study_generator": ["your_product"], "newsletter_builder": ["your_product"], "webinar_script": ["your_product"], "content_repurposer": ["source_content"], "thought_leadership_series": ["topic"], "testimonial_capture": ["your_product"], "sales_enablement_content": ["product"], "craft_content_improver": ["content"], "account_plan_builder": ["your_solution"], "roi_business_case_builder": ["your_solution"], "mutual_action_plan_generator": ["your_solution"], "win_loss_analyzer": ["your_solution"], "deal_strategy_coach": ["your_solution"], "discovery_question_bank": ["your_solution"], "proposal_section_writer": ["your_solution"], "email_sequence_generator": ["your_solution"], "demo_script_builder": ["your_solution"], "pricing_negotiation_guide": ["your_solution"], "champion_enablement_kit": ["your_solution"], "competitive_trap_setter": ["your_solution"]};
const GTM_INDUSTRY_TOOLS=["pmf_scorecard", "launch_commander", "customer_interview_kit", "retention_playbook", "partner_architect", "crisis_planner", "competitive_intel", "craft_gtm_analyzer"];

/** EPIC rules retain the documented trigger floor, with clause evidence and optional confirmed facts. */
export function epicReading(text:string, floor:RegExp, kind:string, typed?:unknown):SignalReading {
 if(['present','none','unknown'].includes(String(typed)))return {state:typed==='present'?'affirmed':typed==='none'?'negated':'unclear',evidence:['Confirmed '+kind.replace(/_/g,' ')+': '+typed],matched:[]};
 const all=clauses(text).map(c=>{const r=readSignal(c,floor,SIGNALS[kind]);
  if(kind==='ai_search'&&/\b(?:organic (?:traffic|search)|seo leads?)\b.{0,20}\b(?:not|never|isn't|aren't)\b.{0,15}(?:drop|declin|down|fall|collaps)/i.test(c))return {...r,state:'negated' as SignalState};
  return r;
 });
 const states=all.map(r=>r.state);return {state:states.includes('affirmed')&&states.includes('negated')?'unclear':states.includes('affirmed')?'affirmed':states.includes('unclear')?'unclear':states.includes('negated')?'negated':'absent',evidence:[...new Set(all.flatMap(r=>r.evidence))],matched:[...new Set(all.flatMap(r=>r.matched))]};
}
export function epicChannelReview(text:string, nrrLow:boolean, selfServe:boolean|null):string[] {
 if(!text.trim())return [];
 const result:string[]=[];
 for(const c of clauses(text)){
  const failed=readSignal(c,/\b(?:failed|not working|no (?:qualified )?(?:leads|deals|pipeline)|zero (?:leads|deals)|lost money|unprofitable)\b/i);
  if(failed.state==='affirmed')result.push('Pause additional spend on the activity described until its owner explains the failure and sets a measurable restart condition. Sentence read: "'+c+'".');
  const acquisition=epicReading(c,/pipeline|new\s*logo|acquisition|top\s*of\s*(the\s*)?funnel|more\s*leads/i,'leaky');
  if(nrrLow&&acquisition.state==='affirmed')result.push('Stop expanding acquisition spend while net revenue retention is below 100%; first establish the retention problem and a recovery measure. Sentence read: "'+c+'".');
  const plg=readSignal(c,/\b(?:PLG|self[- ]serve|free trial|freemium)\b/i);
  if(selfServe===false&&plg.state==='affirmed')result.push('Pause a self-serve campaign until buyers can reach value without sales help, or use a sales-assisted pilot. Sentence read: "'+c+'".');
 }
 return [...new Set(result.length?result:['The channel list alone does not establish waste. Supply spend, qualified pipeline and closed revenue for each activity before deciding what to stop.'])];
}

const READER_LABELS:Record<string,string>={"average_contract_value":"annual contract value in US dollars","total_potential_companies":"number of potential companies","your_sector":"your selected sector","business_model":"how you charge","customer_feedback":"customer feedback","company_name":"company name","icp_deep_dive":"ICP Deep Dive","customers":"customers","customer_descriptions":"customer descriptions","product_category":"product category","company":"company","icp_scoring_model":"ICP Scoring Model","scoring_criteria":"scoring criteria","correlation_direction":"correlation direction","success_correlation":"success correlation","buyer_group_analyzer":"Buyer Group Analyzer","deal_size":"deal size","target_company_size":"target company size","known_stakeholders":"known stakeholders","typical_champion":"typical champion","tam_sam_som_calculator":"TAM SAM SOM Calculator","icp_percentage":"icp percentage","year1_market_share_target":"year1 market share target","data_sources":"data sources","segment_name":"segment name","lookalike_signal_generator":"Lookalike Signal Generator","icp_firmographics":"icp firmographics","icp_technographics":"icp technographics","champion_titles":"champion titles","buying_triggers":"buying triggers","platforms":"platforms","account_prioritization":"Account Prioritization","accounts":"accounts","prioritization_weights":"prioritization weights","icp_gap_analysis":"ICP Gap Analysis","current_customers":"current customers","ideal_icp":"ideal icp","current_metrics":"current metrics","target_metrics":"target metrics","icp_evolution_tracker":"ICP Evolution Tracker","current_icp":"current icp","recent_wins":"recent wins","recent_losses":"recent losses","market_changes":"market changes","time_period":"time period","icp_interview_synthesizer":"ICP Interview Synthesizer","interview_notes":"interview notes","impact_get_framework":"IMPACT Framework Guide","focus_phase":"focus phase","sector":"sector","impact_identify_champions":"Identify Champions","product_description":"product description","problem_solved":"problem solved","target_company_type":"target company type","price_point":"price point","impact_map_alternatives":"Map Alternatives","your_product":"your product","category":"category","competitors":"competitors","competitor_weaknesses":"competitor weaknesses","your_strengths":"your strengths","impact_pinpoint_value":"Pinpoint Value","product_name":"product name","target_customer":"target customer","key_outcome":"key outcome","unique_capability":"unique capability","customer_metrics":"customer metrics","impact_anchor_market":"Anchor Market","potential_segments":"potential segments","customer_pain":"customer pain","average_deal_size":"average deal size","sales_cycle":"sales cycle","company_counts":"company counts","percent_matching_icp":"percent matching icp","year_one_share_percent":"year one share percent","impact_craft_message":"Craft Message","customer_need":"customer need","key_benefit":"key benefit","competitor":"competitor","differentiation":"differentiation","impact_translate_execution":"Translate Execution","positioning_statement":"positioning statement","channels":"channels","impact_full_audit":"IMPACT Full Audit","key_differentiation":"key differentiation","current_positioning":"current positioning","pmf_scorecard":"PMF Scorecard","product":"product","target_market":"target market","time_in_market":"time in market","launch_commander":"Launch Commander","product_feature":"product feature","launch_date":"launch date","launch_type":"launch type","target_segments":"target segments","goals":"goals","available_channels":"available channels","team_size":"team size","budget_level":"budget level","industry":"industry","customer_interview_kit":"Customer Interview Kit","interview_type":"interview type","product_context":"product context","product_complexity":"product complexity","target_persona":"target persona","key_hypotheses":"key hypotheses","retention_playbook":"Retention Playbook","customer_segment":"customer segment","current_churn_rate":"current churn rate","churn_reasons":"churn reasons","available_data_signals":"available data signals","cs_team_size":"cs team size","current_interventions":"current interventions","partner_architect":"Partner Architect","partner_model":"partner model","partner_goals":"partner goals","your_deal_size":"your deal size","partner_support_capacity":"partner support capacity","existing_partners":"existing partners","crisis_planner":"Crisis Planner","customer_base":"customer base","data_sensitivity":"data sensitivity","potential_crises":"potential crises","company_size":"company size","compliance_requirements":"compliance requirements","competitive_intel":"Competitive Intel","your_weaknesses":"your weaknesses","competitor_details":"competitor details","common_objections":"common objections","craft_gtm_analyzer":"CRAFT GTM Analyzer","document_content":"document content","document_type":"document type","intended_audience":"intended audience","desired_outcome":"desired outcome","case_study_generator":"Case Study Generator","customer_name":"customer name","customer_industry":"customer industry","mode":"mode","challenge":"challenge","solution":"solution","results":"results","customer_quote":"customer quote","newsletter_builder":"Newsletter Builder","topic":"topic","key_points":"key points","cta_goal":"cta goal","audience_segment":"audience segment","newsletter_type":"newsletter type","tone":"tone","previous_topics":"previous topics","webinar_script":"Webinar Script","target_audience":"target audience","webinar_type":"webinar type","duration":"duration","key_takeaways":"key takeaways","speakers":"speakers","include_polls":"include polls","product_mention_level":"product mention level","content_repurposer":"Content Repurposer","source_content":"source content","source_type":"source type","target_formats":"target formats","brand_voice":"brand voice","key_message":"key message","thought_leadership_series":"Thought Leadership Series","your_take":"your take","target_reader":"target reader","proof_points":"proof points","author_background":"author background","num_articles":"num articles","article_type":"article type","testimonial_capture":"Testimonial Capture","customer_status":"customer status","customer_company":"customer company","customer_role":"customer role","relationship_context":"relationship context","success_story":"success story","testimonial_type":"testimonial type","use_case":"use case","incentive":"incentive","sales_enablement_content":"Sales Enablement Content","value_props":"value props","competitor_objections":"competitor objections","price_context":"price context","sales_stage":"sales stage","craft_content_improver":"CRAFT Content Improver","content":"content","content_type":"content type","goal":"goal","audience":"audience","tone_preference":"tone preference","account_plan_builder":"Account Plan Builder","account_name":"account name","current_arr":"current arr","known_contacts":"known contacts","current_products":"current products","expansion_opportunities":"expansion opportunities","competitive_threats":"competitive threats","your_solution":"your solution","account_notes":"account notes","deal_strategy_coach":"Deal Strategy Coach","blocker_status":"blocker status","economic_buyer_engagement":"economic buyer engagement","incumbent_status":"incumbent status","project_status":"project status","deal_name":"deal name","deal_value":"deal value","deal_stage":"deal stage","days_in_stage":"days in stage","champion_status":"champion status","economic_buyer":"economic buyer","blockers":"blockers","next_steps":"next steps","close_date":"close date","discovery_question_bank":"Discovery Question Bank","framework":"framework","prospect_industry":"prospect industry","prospect_role":"prospect role","known_pain_points":"known pain points","known_metrics":"known metrics","gaps_to_fill":"gaps to fill","roi_business_case_builder":"ROI Business Case Builder","annual_revenue":"annual revenue","employee_count":"employee count","solution_price":"solution price","primary_value_driver":"primary value driver","current_annual_cost":"current annual cost","expected_improvement_percent":"expected improvement percent","annual_value_estimate":"annual value estimate","current_process":"current process","implementation_timeline":"implementation timeline","mutual_action_plan_generator":"Mutual Action Plan Generator","target_close_date":"target close date","current_stage":"current stage","buyer_champion":"buyer champion","technical_evaluators":"technical evaluators","procurement_contact":"procurement contact","known_requirements":"known requirements","known_process_steps":"known process steps","win_loss_analyzer":"Win/Loss Analyzer","analysis_type":"analysis type","deal_outcome":"deal outcome","deal_details":"deal details","loss_reason":"loss reason","competitor_won":"competitor won","sales_cycle_days":"sales cycle days","stakeholders_involved":"stakeholders involved","multiple_deals":"multiple deals","proposal_section_writer":"Proposal Section Writer","section_type":"section type","primary_audience":"primary audience","customer_challenges":"customer challenges","key_differentiators":"key differentiators","pricing":"pricing","implementation_approach":"implementation approach","success_metrics":"success metrics","email_sequence_generator":"Email Sequence Generator","sequence_type":"sequence type","target_industry":"target industry","key_value_prop":"key value prop","specific_pain_point":"specific pain point","social_proof":"social proof","call_to_action":"call to action","num_emails":"num emails","sender_context":"sender context","demo_script_builder":"Demo Script Builder","demo_type":"demo type","attendees":"attendees","key_pain_points":"key pain points","competitor_context":"competitor context","demo_duration":"demo duration","must_show_features":"must show features","known_objections":"known objections","pricing_negotiation_guide":"Pricing Negotiation Guide","scenario":"scenario","discount_requested":"discount requested","competitor_price":"competitor price","value_delivered":"value delivered","buyer_leverage":"buyer leverage","your_leverage":"your leverage","decision_timeline":"decision timeline","approval_authority":"approval authority","champion_enablement_kit":"Champion Enablement Kit","asset_type":"asset type","champion_name":"champion name","champion_role":"champion role","target_stakeholder":"target stakeholder","key_value_points":"key value points","competitive_context":"competitive context","budget_context":"budget context","urgency_drivers":"urgency drivers","champion_wins":"champion wins","competitive_trap_setter":"Competitive Trap Setter","evaluation_stage":"evaluation stage","buyer_priorities":"buyer priorities","buyer_persona":"buyer persona","trap_type":"trap type","name":"name","size":"size","acv":"acv","tech_stack":"tech stack","buying_trigger":"buying trigger","champion_title":"champion title","criterion":"criterion","importance":"importance","values":"values","industries":"industries","company_sizes":"company sizes","locations":"locations","funding_stages":"funding stages","fit_score":"fit score","intent_signals":"intent signals","relationship":"relationship","timing":"timing","fit":"fit","intent":"intent","avg_acv":"average annual contract value","avg_sales_cycle":"average sales cycle","win_rate":"win rate","churn_rate":"churn rate","nps":"NPS","customer":"customer","role":"role","key_quotes":"key quotes","pain_points":"pain points","value_realized":"value realized"};
export function readerLabel(value:string):string {return READER_LABELS[value]||value.replace(/_/g,' ')}
/** Validation text only: translate the generated field path, never a caller's quoted value. */
export function readerIssue(value:string):string {return value.replace(/^[a-z][a-z0-9_]*(?:\[\d+\])?(?:\.[a-z][a-z0-9_]*(?:\[\d+\])?)*/i,path=>path.split('.').map(readerLabel).join(' / '))}
export function claimRisk(text:string):{hold:boolean;reason:string;evidence:string} {
 const adverse=readSignal(text,/\b(?:collections|revenue|retention|sales|results?)\s+(?:(?:are|is|were|was)\s+)?(?:down|declined|dropped|fell|worse)|\bno (?:customer|client|user)[^.!?]*improvement|\b(?:cancelled|canceled|requested (?:a )?refund|asked for (?:a )?refund|lost money)\b/i);
 if(adverse.state==='affirmed')return{hold:true,reason:'adverse result',evidence:text};
 if(readSignal(text,/\b(?:cannot|can not|can't|could not|unable to|no|without|lack of|not supplied|not available)[^.!?]{0,45}\b(?:evidence|proof|substantiat\w*)\b|\b(?:unproven|unverified|unsupported)\b/i).state==='affirmed')return{hold:true,reason:'supporting evidence is missing',evidence:text};
 if(readSignal(text,/\b(?:guaranteed|forever|eliminat\w* (?:every|all)|100\s*% of|world[- ]class|best[- ]in[- ]class|cutting[- ]edge|the leading platform|transform(?:s|ing)? (?:your|the) business)\b/i).state==='affirmed')return{hold:true,reason:'absolute or generic claim needs substantiation',evidence:text};
 return{hold:false,reason:'',evidence:text};
}
export function outcomeReading(text:string):SignalReading {
 return readSignal(text,/\b(?:(?:we|our team|our company) (?:have )?lost(?: this| the)? deal|(?:this|the) deal (?:was|is) lost|lost this deal|the buyer (?:chose|selected) (?:the |an? )?(?:competitor|rival|internal tool|alternative))\b/i);
}

export function contactDeclined(text:string, typed?:unknown):SignalReading {
 if(['allowed','declined','unknown'].includes(String(typed)))return{state:typed==='declined'?'affirmed':typed==='allowed'?'negated':'unclear',evidence:['Contact permission: '+typed],matched:[]};
 return readSignal(text,/\b(?:told us not to call(?: again)?|asked us to stop contact(?:ing)?(?: them)?|do not contact(?: us| them)?(?: again)?|do not call(?: us| them)?(?: again)?|stop calling(?: us| them)?|opted out|unsubscribed|withdrew (?:their )?consent)\b/i);
}
export function claimOwnerConflict(text:string, alternatives:string[], ownProduct:string):boolean {
 const normal=(x:string)=>x.toLowerCase().replace(/\\([\s\S])/g,'$1').replace(/^["']|["']$/g,'').trim();const t=normal(text),own=normal(ownProduct);
 return alternatives.some(x=>{const alt=normal(x.split('(')[0]);return alt.length>=3&&alt!==own&&t.startsWith(alt)&&/^[\s:,.]/.test(t.slice(alt.length));});
}

/** These labels classify stated goals, not achieved business results. */
export function launchGoalReading(text:string):{kind:string;evidence:string;state:SignalState} {
 const groups:[string,RegExp][]=[
  ['Pipeline',/\bpipeline\b|qualified (?:opportunities|deals)[^.;]{0,35}(?:worth|value)|potential contract value/i],
  ['Revenue',/\brevenue\b|\bclosed\b|\barr\b|\bmrr\b|bookings?|deal value|signed (?:contracts|deals)|money collected/i],
  ['Engagement',/meeting|demo|sign-?up|trial|\bleads?\b|registr|attend|click|\bctr\b|opportunit|\bcalls?\b|inquir|enquir|workshop|survey|assessment|buying conversations/i],
  ['Awareness',/view|impression|visit|traffic|reach|download|follower|aware|become known/i],
  ['Adoption',/activat|usage|active user|adopt|conversion|retention|rollout|renew|reference|go-?live|live sites?|pilot|people using it/i]
 ];
 const readings=groups.map(([kind,re])=>({kind,reading:readSignal(text,re)}));
 // A pipeline amount is not booked revenue; a dollar sign alone does not settle the measure.
 const pipeline=readings.find(x=>x.kind==='Pipeline'&&x.reading.state==='affirmed');
 if(pipeline)return{kind:'Pipeline',evidence:text,state:'affirmed'};
 const found=readings.find(x=>x.reading.state==='affirmed');
 if(found)return{kind:found.kind,evidence:text,state:'affirmed'};
 return{kind:'Other',evidence:text,state:readings.some(x=>x.reading.state==='negated')?'negated':'unclear'};
}
export function securityIncident(text:string):SignalReading {return readSignal(text,/breach|security|hack|exposure/i,SIGNALS.security)}
export function illustrativeProof(text:string):SignalReading {return readSignal(text,/\b(?:illustrative|hypothetical|fictional|made[- ]up|not (?:an? )?(?:actual|real|customer) (?:result|outcome)|example (?:only|figure|scenario)|for illustration|assumed saving)\b/i)}
export function scopeDisposition(text:string):SignalReading {return readSignal(text,/\b(?:business|division|business unit)[^.;]{0,50}\b(?:was|has been|is) (?:sold|divested|closed)|\bwe (?:have )?(?:divested|sold|closed)[^.;]{0,35}\b(?:business|division)|\bno longer (?:sell|offer|serve)\b/i)}
export function statedGoalCount(text:string):{count:number;phrase:string;unit:string}|null {
 const numbers:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,forty:40,fifty:50};
 const units='(pilot sites?|deals?|meetings?|pilots?|sites?|customers?|clients?|demos?|workshops?|surveys?|accounts?|opportunities|sign-?ups?|calls?|trials?|partners?|references?)';
 const forward=new RegExp('(?:^|[^\\w$.,])(\\d[\\d,]*|'+Object.keys(numbers).join('|')+')\\s+((?:[a-z-]+\\s+){0,3}?)'+units+'\\b','i');
 const reverse=new RegExp('\\b'+units+'\\s*:\\s*(\\d[\\d,]*)\\b','i');
 const m=forward.exec(text),r=!m?reverse.exec(text):null;
 if(!m&&!r)return null;
 if(readSignal(text,m?forward:reverse).state!=='affirmed')return null;
 const typed=m?m[1]:r![2],unit=m?m[3]:r![1];
 let count=/^\d/.test(typed)?parseInt(typed.replace(/,/g,''),10):numbers[typed.toLowerCase()];
 if(m&&/^dozen\b/i.test(m[2]))count*=12;
 return{count,unit,phrase:m?`${typed} ${m[2]}${unit}`.replace(/\s+/g,' ').trim():`${typed} ${unit}`};
}

export function buyingConstraint(text:string):SignalReading {return readSignal(text,/\b(?:bankrupt(?:cy)?|insolvent|insolvency|no (?:purchase|buying|procurement) budget|unable to (?:pay|buy|purchase))\b/i)}
export type ObjectionKind='price'|'comparison'|'timing'|'capability'|'explain'|'risk'|'security'|'other';
/** Same clause reading for a spoken response and its approach. Question syntax alone is not a stated concern. */
export function objectionKind(text:string,named=false):ObjectionKind {
 const o=text.toLowerCase(),on=(r:RegExp,extra?:RegExp)=>readSignal(text,r,extra).state==='affirmed';
 const asksHow=/^\s*(?:how (?:does|do|is|are)|why (?:do|does|is|are)|what (?:is|are|does|do)|what's)\b/.test(o)&&!on(/\b(compared?|cheaper|better|than|versus|vs|competitors?|alternatives?|expensive)\b/i);
 if(asksHow&&on(/\b(price|prices|pricing|cost|costs|charges?|rates?|fees?)\b/i))return'explain';
 if(on(/\b(price|prices|pricing|expensive|cost|costs|budget|cheaper|cheap|charges?|rates?|fees?)\b/i,SIGNALS.price))return'price';
 if(named||on(/\b(differ\w*|different|versus|vs|compared? (?:to|with)|instead of|why (?:\w+ ){0,3}over|better than|competitors?|alternatives?|other (?:vendors?|options?|tools?)|rivals?)\b/i))return'comparison';
 if(on(/\b(timing|not ready|ready|later|next year|not now|right now|this quarter)\b/i,SIGNALS.timing))return'timing';
 if(on(/security|privacy|compliance|data protection/i,SIGNALS.security))return'security';
 if(/^\s*(?:how (?:does|do)|what (?:is|are|does|do)|what's)\b/.test(o)&&!/\b(long|quickly|fast|take to|easy|easily|support|integrate|different)\b/.test(o))return'explain';
 if(on(/\b(features?|can't|cannot|doesn't|does it|do you|does .* support|missing|lack|lacks|lacking|support|how long|how quickly|how fast|take to|get(?:ting)? started|how easy)\b/i,SIGNALS.feature)||/^\s*(?:does|do|can|is|are|will)\b/.test(o))return'capability';
 if(on(/\b(risk|risky|trust|new|proven|unproven)\b/i))return'risk';
 return'other';
}

/** Preserve the text and delimiters of straight or typographic double-quoted passages. */
export function quotedPassages(text:string):string[] {return text.match(/"[^"\n]+"|“[^”\n]+”/g)||[]}

export function launchFollowup(goals:string[],fallback:string):string {
 const tasks:Record<string,string>={Pipeline:'Inspect qualified opportunities separately from signed revenue',Revenue:'Check signed contracts and the revenue period with finance',Engagement:'Assign invitations and review completed qualified meetings',Awareness:'Inspect reach within the intended audience',Adoption:'Review activation against agreed completion criteria'};
 return [...new Set(goals.map(g=>tasks[launchGoalReading(g).kind]).filter(Boolean))].join('; ')||fallback;
}
