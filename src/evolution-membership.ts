import {readProfile, coverageInfo, splitTop} from './rw-icp.ts';
import {hasSignal} from './text-signals.ts';

type MatchState = 'match' | 'different' | 'unknown';
export interface EvolutionPart {name:string; expected:string[]; observed:string[]; state:MatchState}
export interface EvolutionMatch {parts:EvolutionPart[]; matched:string[]; different:string[]; unknown:string[]}
const clean=(s:string)=>s.trim().replace(/[.;\s]+$/,'');
const words=(s:string)=>s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean).join(' ');
const escapeRe=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// These spellings only compare a recorded place. They never establish account location.
const placeForms:Record<string,string[]>={
 India:['India','Indian'],UAE:['UAE','United Arab Emirates','Emirati'],
 'United States':['United States','USA','American'], 'United Kingdom':['United Kingdom','UK','British'],
 Singapore:['Singapore','Singaporean'],Canada:['Canada','Canadian'],Australia:['Australia','Australian'],
 Germany:['Germany','German'],France:['France','French'],Japan:['Japan','Japanese'],
 'New Zealand':['New Zealand'],Indonesia:['Indonesia','Indonesian'],
};
const placePattern=(forms:string[])=>new RegExp('\\b(?:'+forms.map(escapeRe).sort((a,b)=>b.length-a.length).join('|')+')\\b','i');
function places(text:string):string[]{
 return Object.entries(placeForms).filter(([,forms])=>hasSignal(text,placePattern(forms))).map(([place])=>place);
}
function withoutPlaces(text:string):string{
 let out=text;for(const forms of Object.values(placeForms))out=out.replace(new RegExp(placePattern(forms).source,'gi'),' ');
 return clean(out.replace(/\b(?:in|across|throughout|within|from|the)\b/gi,' ').replace(/\s+/g,' '));
}
const labelRe=/(?:^|[.;\n]\s*)(segments?|industries|place|location|country|trigger|signer|champion|buyer|size|problem)\s*:\s*/gi;
function labelled(text:string):{prefix:string; values:Record<string,string[]>}{
 const hits=[...text.matchAll(labelRe)],values:Record<string,string[]>={};
 for(let i=0;i<hits.length;i++){
  let key=hits[i][1].toLowerCase();if(/segments?|industries/.test(key))key='segment';if(/place|location|country/.test(key))key='place';
  const value=clean(text.slice(hits[i].index!+hits[i][0].length,hits[i+1]?.index??text.length));
  (values[key]??=[]).push(value);
 }
 return {prefix:clean(text.slice(0,hits[0]?.index??text.length)),values};
}
function roleIn(text:string,key:string,fields:Record<string,string[]>):string[]{
 if(fields[key])return fields[key];
 const tail=new RegExp('^(.+?)\\s+'+key+'\\s*$','i');
 return text.split(/,(?!\d{3}\b)|;/).map(clean).flatMap(c=>{
  const m=c.match(tail);if(m)return [m[1]];
  if(key==='signer'){const natural=c.match(/^(.+?)\s+(?:signs|signed)(?:\s+(?:the\s+)?(?:contract|order|purchase))?$/i);if(natural&&hasSignal(c,/\b(?:signs|signed)\b/i))return [natural[1]];}
  return [];
 });
}
const roleAliases:Record<string,string>={ciso:'chief information security officer',cio:'chief information officer',cfo:'chief financial officer',ceo:'chief executive officer',cto:'chief technology officer',coo:'chief operating officer',cmo:'chief marketing officer',cro:'chief revenue officer'};
const roleKey=(text:string)=>words(text).split(' ').map(w=>roleAliases[w]||w).join(' ').replace(/\b(?:the|a|an)\b/g,'').replace(/\s+/g,' ').trim();
const triggerKey=(text:string)=>words(text).replace(/\bregulatory\b/g,'regulator').replace(/\btrigger\b/g,'').replace(/\b(?:on|for)\b.*$/,'').replace(/\b(?:a|an|the)\b/g,'').replace(/\s+/g,' ').trim();
const criterionKnown=(text:string)=>! /\b(?:unknown|unclear|unconfirmed|maybe|perhaps|not (?:confirmed|known|recorded|stated|required)|no (?:requirement|criterion))\b/i.test(text);
function directMatch(expected:string,observed:string):boolean{
 const c=coverageInfo(expected,observed);
  return c.matched.length>0&&c.direct>0&&c.alias===0&&c.ratio===1&&c.matched.every(w=>hasSignal(observed,new RegExp('\\b'+escapeRe(w)+'\\b','i')));
}
export function evolutionMatch(icp:string,win:string):EvolutionMatch{
 const want=labelled(icp),got=labelled(win),parts:EvolutionPart[]=[];
 const base=want.values.segment?.join(', ')||want.prefix;
 const qualifier=base.match(/\b(?:with|who|that|which)\b[\s\S]*$/i)?.[0];
 const segmentText=qualifier?base.slice(0,base.indexOf(qualifier)):base;
 const profile=readProfile(withoutPlaces(segmentText));
 const expectedSegments=(want.values.segment?splitTop(withoutPlaces(segmentText),/,/):profile.segments).filter(x=>!/^\d+$/.test(x));
 const head=got.values.segment?.join(', ')||got.prefix.split(/,(?!\d{3}\b)|;/)[0];
 const winSegment=withoutPlaces(head).split(/\s+(?:serving|selling to|sold to|for|used by|bought by)\s+/i)[0].replace(/^(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+/i,'').trim();
 const roleOnly=readProfile(head).roles.some(r=>roleKey(withoutPlaces(r))===roleKey(winSegment));
 const segmentUnknown=roleOnly||!winSegment||/\b(?:unknown|not (?:recorded|stated|confirmed)|unclear|maybe|perhaps|no win data)\b/i.test(winSegment);
 if(expectedSegments.length){
  const differentSubject=/\b(?:vendor|software|consultancy|consultant|agency|platform|tool)\b/i.exec(winSegment)?.[0];
  const matches=expectedSegments.some(s=>directMatch(s,winSegment)&&(!differentSubject||new RegExp('\\b'+escapeRe(differentSubject)+'\\b','i').test(s)));
  const partial=expectedSegments.some(s=>{const c=coverageInfo(s,winSegment);return c.direct>0||c.alias>0;});
  parts.push({name:'segment',expected:expectedSegments,observed:winSegment?[winSegment]:[],state:segmentUnknown?'unknown':matches?'match':partial?'unknown':'different'});
 }else parts.push({name:'segment',expected:[],observed:winSegment?[winSegment]:[],state:'unknown'});
 const canonicalPlace=(s:string)=>places(s)[0]||s.replace(/^the\s+/i,'');
 const expectedPlaceText=want.values.place?.join('; ')||base,observedPlaceText=got.values.place?.join('; ')||head;
 const explicitLocation=win.split(/,(?!\d{3}\b)|;/).map(clean).filter(c=>/^(?:in|from|based in|located in)\s+/i.test(c));
 const locationText=[observedPlaceText,...explicitLocation].join('; ');
 const readPlaces=(text:string)=>[...new Set([...places(text),...readProfile(text).places.filter(p=>hasSignal(text,new RegExp('\\b'+escapeRe(p)+'\\b','i'))).map(canonicalPlace)])];
 const expectedPlaces=readPlaces(expectedPlaceText),observedPlaces=readPlaces(locationText);
 const compare=(observed:string[],expected:string[],key:(s:string)=>string=(s)=>s):MatchState=>!observed.length?'unknown':observed.every(o=>expected.some(e=>key(e)===key(o)))?'match':observed.some(o=>expected.some(e=>key(e)===key(o)))?'unknown':'different';
 if(expectedPlaces.length)parts.push({name:'place',expected:expectedPlaces,observed:observedPlaces,state:compare(observedPlaces,expectedPlaces)});
 for(const key of ['champion','signer','buyer'] as const){
  const expected=want.values[key];if(!expected)continue;
  const observed=roleIn(win,key,got.values),usable=observed.filter(x=>hasSignal(x,/\b(?:[a-z]+)\b/i)&&! /\b(?:not|no|unknown|unclear|unconfirmed|maybe|perhaps)\b/i.test(x));
  parts.push({name:key,expected,observed,state:expected.every(criterionKnown)?compare(usable,expected,roleKey):'unknown'});
 }
 if(want.values.trigger){
  const expected=want.values.trigger;
  const observed=got.values.trigger||win.split(/,(?!\d{3}\b)|;/).map(clean).filter(x=>/\b(?:trigger|mandate|incident|launch|funding|audit|renewal)\b/i.test(x)&&! /\b(?:champion|signer|buyer)\b/i.test(x));
  const usable=observed.filter(x=>hasSignal(x,/\b(?:trigger|mandate|incident|launch|funding|audit|renewal)\b/i));
  parts.push({name:'trigger',expected,observed,state:expected.every(criterionKnown)&&expected.every(e=>hasSignal(e,/\b(?:trigger|mandate|incident|launch|funding|audit|renewal)\b/i))?compare(usable,expected,triggerKey):'unknown'});
 }
 const qualifierName=qualifier&&/\binstalls\b/i.test(qualifier)?'app installs':qualifier&&/\bemployees\b/i.test(qualifier)?'company size':'other criteria';
 for(const [name,expected] of [[qualifierName,qualifier?[qualifier]:[]],['size',want.values.size||[]],['problem',want.values.problem||[]]] as [string,string[]][]){
  if(expected.length)parts.push({name,expected,observed:[],state:'unknown'});
 }
 return {parts,matched:parts.filter(p=>p.state==='match').map(p=>p.name),different:parts.filter(p=>p.state==='different').map(p=>p.name),unknown:parts.filter(p=>p.state==='unknown').map(p=>p.name)};
}
