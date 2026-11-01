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
  adverse_result: /\b(?:(?:costs?|errors?|delays?|churn|losses?|tickets?) (?:rose|grew|increased|doubled)|(?:revenue|collections|retention|sales) (?:fell|dropped|declined)|lost money|worse than before|no (?:customer|client|user).*improvement|cancelled|canceled|refund)\b/i,
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
export function signal(text:string,kind:string):SignalReading{return readSignal(text,SIGNALS[kind]??/(?!)/)}
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
