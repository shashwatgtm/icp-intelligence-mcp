import { REGIONS, JURISDICTIONS, SECTOR_REGION_NOTES, REGION_SOURCES, REGION_REVIEW_DATE, type RegionId } from './regions.ts';
import { explainSector } from './verticals.ts';

export interface RegionReading { region: RegionId; jurisdictions: string[] }
interface Place { region: RegionId; jurisdiction?: string; pattern: RegExp }
const PLACES: readonly Place[] = [
  {region:'india',jurisdiction:'india',pattern:/\bIndia\b|\bIndian\s+(?:market|buyers?|banks?|customers?|enterprises?|businesses?)\b/gi},
  {region:'southeast-asia',pattern:/\bSouth(?:east| East)[ -]Asia\b|\bASEAN\b/gi},
  {region:'southeast-asia',jurisdiction:'singapore',pattern:/\bSingapore\b/gi},
  {region:'southeast-asia',pattern:/\b(?:Malaysia|Indonesia|Thailand|Vietnam|Viet Nam|Philippines|Cambodia|Laos|Myanmar|Brunei|Timor Leste)\b/gi},
  {region:'middle-east',pattern:/\bMiddle East\b|\bGCC\b/gi},
  {region:'middle-east',jurisdiction:'uae',pattern:/\b(?:United Arab Emirates|UAE)\b/gi},
  {region:'middle-east',jurisdiction:'saudi',pattern:/\bSaudi Arabia\b|\bKSA\b/gi},
  {region:'middle-east',pattern:/\b(?:Qatar|Bahrain|Oman|Kuwait|Jordan|Lebanon)\b/gi},
  {region:'united-kingdom',jurisdiction:'uk',pattern:/\b(?:United Kingdom|UK|Britain|Great Britain)\b/gi},
  {region:'europe',pattern:/\bEurope\b|\bEuropean\s+(?:market|buyers?|banks?|customers?|businesses?)\b/gi},
  {region:'europe',jurisdiction:'germany',pattern:/\bGermany\b|\bGerman\s+(?:market|buyers?|banks?|customers?|businesses?)\b/gi},
  {region:'europe',jurisdiction:'eu',pattern:/\bEuropean Union\b|\bEU\b|\b(?:France|Netherlands|Belgium|Italy|Spain|Portugal|Ireland|Austria|Poland|Denmark|Sweden|Finland|Greece|Czechia|Croatia|Romania|Bulgaria|Estonia|Latvia|Lithuania|Luxembourg|Malta|Cyprus|Slovakia|Slovenia|Hungary)\b/gi},
  {region:'europe',pattern:/\b(?:Switzerland|Norway|Iceland)\b/gi},
  {region:'united-states',jurisdiction:'usa',pattern:/\bUnited States(?: of America)?\b|\bUSA\b/gi},
  {region:'united-states',jurisdiction:'california',pattern:/\bCalifornia\b/gi}
];
// Allowlist context fields. Names, roles, quotes, stack names, data sources and evidence
// are excluded: a place inside them does not establish a market or operating scope.
const CONTEXT_KEYS = new Set(['product_category','product_description','description','customer_descriptions','current_customers','ideal_icp','current_icp','target_customer','target_customers','target_market','target_audience','segment_name','industry','industries','region','regions','country','countries','location','locations','geography','geographies','market','markets']);
const CONTAINER_KEYS = new Set(['customers','accounts','icp_firmographics','firmographics','segments']);
function keyOf(key:string):string {return key.toLowerCase().replace(/[ -]+/g,'_');}
export function regionInputTexts(args:unknown):string[] {
  const texts:string[]=[];
  const visit=(value:unknown,allowText=false,depth=0):void=>{
    if(depth>12)return;
    if(typeof value==='string') {
      const v=value.trim();
      if(/^[\[{]/.test(v)) {try{visit(JSON.parse(v),false,depth+1);return;}catch{/* ordinary text */}}
      if(allowText&&v)texts.push(v);
    } else if(Array.isArray(value))value.forEach(v=>visit(v,allowText,depth+1));
    else if(value&&typeof value==='object')for(const [key,v] of Object.entries(value)) {
      const k=keyOf(key);if(CONTEXT_KEYS.has(k))visit(v,true,depth+1);else if(CONTAINER_KEYS.has(k))visit(v,false,depth+1);
    }
  };
  visit(args);return texts;
}
function normalize(text:string):string {
  return text.normalize('NFKC').replace(/\bU\.S\.(?:A\.)?/g,'United States').replace(/\bU\.K\./gi,'United Kingdom').replace(/\bUS\b/g,'United States').replace(/[’]/g,"'");
}
type MentionState='yes'|'no'|'unclear';
function mentionState(clause:string,start:number,end:number):MentionState {
  const prefix=clause.slice(0,start).replace(/\bnot only\b/gi,'');
  const suffix=clause.slice(end);
  // Scope polarity locally; an exclusion after another country must not erase the first.
  const before=prefix.split(/[,;]|\b(?:but|however|whereas|while)\b/i).at(-1)||'';
  const after=suffix.split(/[,;]|\b(?:and|but|however|whereas|while)\b/i)[0];
  let groupTail=suffix;
  for(const place of PLACES)groupTail=groupTail.replace(place.pattern,'PLACE');
  if(/^\s*(?:(?:,|and|or)\s*PLACE\s*)+(?:are|were)\s+(?:not|excluded|out of scope)\b/i.test(groupTail))return'no';
  if(/\b(?:not|never|no|neither|nor|without|except|excluding|exclude|outside|avoid|left|exited|formerly|previously|historically|used to|no longer|stopped|ceased)\b/i.test(before))return'no';
  if(/^\s*(?:(?:is|are|was|were|has been|have been)\s+)?(?:not|no longer|excluded|out of scope|off limits)\b/i.test(after))return'no';
  if(/\b(?:may|might|could|perhaps|maybe|whether|consider(?:ing)?|uncertain|unsure|if|hypothetical|example)\b/i.test(before)||/\?|\b(?:uncertain|unconfirmed|not confirmed)\b/i.test(after))return'unclear';
  if(/\b(?:competitors?|rivals?)\b/i.test(before))return'unclear';
  return'yes';
}
/** Pure, deterministic and conservative. Opposite or uncertain country statements add no notes. */
export function readRegions(texts:readonly string[]):RegionReading[] {
  const mentions=new Map<string,{region:RegionId;jurisdiction?:string;yes:boolean;no:boolean;unclear:boolean}>();
  for(const raw of texts)for(const clause of normalize(raw).split(/[.!?\n]+(?=\s|$)/)) {
    // Preserve question intent before splitting punctuation away.
    const questioned=/\?\s*$/.test(raw.trim())||/^\s*(?:should|could|would|can)\s+(?:we|our)\b/i.test(clause);
    for(const place of PLACES)for(const match of clause.matchAll(new RegExp(place.pattern))) {
      const key=place.jurisdiction||place.region;
      const m=mentions.get(key)||{region:place.region,jurisdiction:place.jurisdiction,yes:false,no:false,unclear:false};
      const state=questioned?'unclear':mentionState(clause,match.index!,match.index!+match[0].length);
      m[state==='yes'?'yes':state==='no'?'no':'unclear']=true;mentions.set(key,m);
    }
  }
  const out:RegionReading[]=[];
  for(const region of REGIONS) {
    const broad=mentions.get(region.id);
    // An explicit exclusion of the broad region defeats country inference in that region.
    const regionExcluded=broad?.no&&!broad.jurisdiction;
    const affirmed=[...mentions.values()].filter(m=>m.region===region.id&&m.yes&&!m.no&&!m.unclear);
    if(!regionExcluded&&affirmed.length)out.push({region:region.id,jurisdictions:[...new Set(affirmed.map(m=>m.jurisdiction).filter((x):x is string=>Boolean(x)))]});
  }
  return out;
}
function sourceLinks(ids:readonly string[]):string {
  return [...new Set(ids)].map(id=>{const s=REGION_SOURCES.find(x=>x.id===id);return s?`[${id}](${s.url})`:'';}).filter(Boolean).join(', ');
}
export function regionNotes(args:unknown):string {
  const texts=regionInputTexts(args),readings=readRegions(texts);
  if(!readings.length)return'';
  const obj=(args&&typeof args==='object'?args:{}) as Record<string,unknown>;
  const sector=explainSector({seller:[obj.product_category,obj.product_description]}).vertical;
  const out=['','', '## Region notes (draft for owner review)', '',`Based only on locations stated in your supplied context. These checks do not change scores, market sizes or the evidence above. Source review: ${REGION_REVIEW_DATE}.`];
  for(const reading of readings) {
    const region=REGIONS.find(x=>x.id===reading.region)!;
    out.push('',`### ${region.name}`,'',`Buying and approvals: ${region.buying}`,`Procurement and payment: ${region.procurement}`,`Buyer language: ${region.language}`,`Proof to prepare: ${region.proof}`);
    if(!reading.jurisdictions.length)out.push('Data and privacy: Name the contracting country and data flow before choosing a legal framework. No country specific legal rule is inferred from this regional label.');
    for(const id of reading.jurisdictions) {
      const note=JURISDICTIONS[id];if(!note)continue;
      out.push(`Data and privacy for ${note.label}: ${note.privacy}${note.sources.length?' Sources: '+sourceLinks(note.sources)+'.':''}`);
      if(note.language)out.push(`Language check for ${note.label}: ${note.language}`);
      if(note.proof)out.push(`Proof check for ${note.label}: ${note.proof}`);
      for(const n of SECTOR_REGION_NOTES.filter(n=>n.jurisdiction===id&&n.vertical===sector?.id))out.push(`Sector check for ${note.label}: ${n.text} Sources: ${sourceLinks(n.sources)}.`);
    }
    out.push('Next action: The account owner confirms the country and contracting entity; procurement confirms the order and payment steps; the privacy or risk reviewer records applicable rules and missing evidence. Revisit these notes when the entity, data flow or market changes.');
  }
  return out.join('\n');
}
