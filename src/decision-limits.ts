/** Canonical decision limits. Conditions use only typed facts or arithmetic, never free-text matches. */
export interface DecisionLimit { text:string; stop:boolean }
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const count={type:'integer',minimum:0};
const percent={type:'number',minimum:0,maximum:100};
const publicationTools=['case_study_generator','testimonial_capture','thought_leadership_series','newsletter_builder','content_repurposer','webinar_script'];
export function decisionInputs(name:string):Record<string,unknown>{
 if(name==='icp_scoring_model')return {held_back_test:{type:'object',description:'Optional results on deals held back before tuning. Ask for the counts and the stop rule set before the test. A missed rule holds the scoring model; do not tune on this set.',properties:{wins_tested:{...count},wins_passing:{...count},non_wins_tested:{...count},non_wins_passing:{...count},minimum_win_pass_percent:{...percent},maximum_non_win_pass_percent:{...percent}},required:['wins_tested','wins_passing','non_wins_tested','non_wins_passing','minimum_win_pass_percent','maximum_non_win_pass_percent']}};
 if(name==='roi_business_case_builder')return {annual_cash_benefit:{type:'number',minimum:0,description:'Optional buyer-confirmed annual cash benefit in US dollars, excluding staff time without a cash release. Ask finance to separate cash from non-cash value. Compared with the annual solution price; a cash deficit holds the investment decision.'}};
 if(name==='pricing_negotiation_guide')return {pricing_authority_status:{type:'string',enum:['authorized','not_authorized','unknown'],description:'Optional confirmed fact. Ask whether the user can approve this price or discount. Free-text role titles do not establish authority; unconfirmed authority holds commitment to terms.'}};
 if(publicationTools.includes(name))return {publication_approval:{type:'string',enum:['approved','not_approved','unknown'],description:'Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission.'}};
 return {};
}
export function decisionHelp(name:string):string {
 if(name==='icp_scoring_model')return ' Ask for held-back test counts and the pre-agreed stop rule when a model has been tested.';
 if(name==='roi_business_case_builder')return ' Ask finance for the cash-only annual benefit when an investment decision depends on cash.';
 if(name==='pricing_negotiation_guide')return ' Ask whether the user has authority to approve the proposed terms.';
 if(publicationTools.includes(name))return ' Ask whether written customer approval covers the exact material and intended use.';
 return '';
}
export function decisionLimit(name:string,args:Record<string,unknown>):DecisionLimit {
 const empty={text:'',stop:false};
 if(name==='icp_scoring_model'&&args.held_back_test!==undefined){
  const t=args.held_back_test as Record<string,unknown>|null;
  const keys=['wins_tested','wins_passing','non_wins_tested','non_wins_passing','minimum_win_pass_percent','maximum_non_win_pass_percent'];
  if(!t||typeof t!=='object'||!keys.every(k=>number(t[k])))return {stop:true,text:'# Scoring decision held: test facts incomplete\n\nSupply the tested and passing counts for wins and non-wins, and both limits from the stop rule agreed before testing. No qualification decision can be drawn from an incomplete test.\n'};
  const w=t.wins_tested as number,wp=t.wins_passing as number,n=t.non_wins_tested as number,np=t.non_wins_passing as number,min=t.minimum_win_pass_percent as number,max=t.maximum_non_win_pass_percent as number;
  if(w<=0||n<=0||wp<0||np<0||wp>w||np>n||min<0||min>100||max<0||max>100||![w,wp,n,np].every(Number.isInteger))return {stop:true,text:'# Scoring decision held: test counts need reconciliation\n\nEach test group needs a positive whole-number total, with passing counts between zero and that total. Confirm the sample and the pre-agreed percentage limits before using the model.\n'};
  const winRate=100*wp/w,nonWinRate=100*np/n;
  if(winRate<min||nonWinRate>max)return {stop:true,text:`# Scoring decision held: held-back test missed its stop rule\n\nWins passing: ${wp} of ${w} (${winRate.toFixed(1)}%); minimum agreed: ${min}%. Non-wins passing: ${np} of ${n} (${nonWinRate.toFixed(1)}%); maximum agreed: ${max}%.\n\nThe score cannot justify automated qualification or rejection on this evidence. Keep decisions under manual review. The sales and revenue operations owners need to review the missed cases, sample size and the rule agreed before testing. Do not retune on these held-back deals; any revised model needs a new held-back test.\n`};
 }
 if(name==='roi_business_case_builder'&&args.annual_cash_benefit!==undefined){
  const benefit=args.annual_cash_benefit,price=args.solution_price;
  if(!number(benefit)||!number(price))return {stop:true,text:'# Investment decision held: cash facts incomplete\n\nFinance needs the annual cash benefit and annual fee in US dollars for the same scope and period. Staff capacity is not cash unless a cost is actually released. No cash return is inferred from missing figures.\n'};
  if(benefit<price)return {stop:true,text:`# Investment decision held: CRITICAL annual cash deficit\n\nAnnual cash benefit: $${benefit.toLocaleString('en-US')}. Annual fee: $${price.toLocaleString('en-US')}. Annual cash balance before implementation and other costs: $${(benefit-price).toLocaleString('en-US')} (cash benefit minus fee).\n\nThe cash case does not support approval at this scope and price. A positive return that includes staff time or other non-cash value cannot settle this cash deficit. Finance and the budget owner need to confirm cash lines, timing and one-time costs, then decide whether to reduce scope, change terms or stop. No investment approval is implied.\n`};
 }
 if(name==='pricing_negotiation_guide'&&['not_authorized','unknown'].includes(String(args.pricing_authority_status)))return {stop:false,text:'## Pricing commitment held: authority unconfirmed\n\nThis output can compare options but cannot approve a price or discount. The authorized commercial owner must confirm the floor, concessions and approval path before any terms are committed.\n\n'};
 if(publicationTools.includes(name)&&['not_approved','unknown'].includes(String(args.publication_approval)))return {stop:false,text:'## Publication held: written customer approval missing\n\nThe material below is a review draft. The customer must approve the exact name, figures, quote and intended use in writing before publication. If the deadline arrives first, the accountable content owner must decide what can be used with permission or whether publication waits; this tool cannot grant that permission.\n\n'};
 return empty;
}
