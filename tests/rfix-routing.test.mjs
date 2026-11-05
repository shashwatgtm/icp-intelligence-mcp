// RFIX regression matrix: exact, same meaning, opposite and negated seller sentences,
// nine verticals by every country of the six regions, field-specific product wording.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFileSync,existsSync} from 'node:fs';
const root=resolve(process.env.REGION_TEST_REPO||'.');
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const pick=n=>{for(const f of ['netlify/lib/'+n+'.js','dist/'+n+'.js','src/'+n+'.mjs','src/'+n+'.ts'])if(existsSync(resolve(root,f))&&!(f.startsWith('netlify')&&!pkg.name.includes('gtm-alpha')))return pathToFileURL(resolve(root,f));throw Error('no '+n+' in '+root);};
const mod=pick;
const {readRegionContext}=await import(mod('region-reader'));
const {REGION_DATA}=await import(mod('regions'));
// vertical, product wording specific to that sector's field, expected subtype (null when the sector has no narrower read)
const V=[
 ['logistics-tech','warehouse management software for warehouse operators','warehousing'],
 ['fintech','lending software for banks','lending'],
 ['vertical-saas','hotel property management software for hotel owners','hotel-lodging'],
 ['ai-native','voice AI agents for contact centres',null],
 ['ites','IT outsourcing and managed engineering services','it-services'],
 ['telecom','CPaaS SMS messaging platform for operators','cpaas-messaging'],
 ['cybersecurity','managed SOC detection and response services','soc-services'],
 ['software','application observability and tracing platform',null],
 ['saas','customer service helpdesk software','customer-service'],
];
// a different product used for denials, always a different sector from the affirmative one
const OTHER=['wealth management software','freight visibility software','CPaaS SMS messaging platform','lending software','wealth management software','lending software','wealth management software','lending software','wealth management software'];
const OTHERV=['fintech','logistics-tech','telecom','fintech','fintech','fintech','fintech','fintech','fintech'];
const countries=[];for(const r of Object.values(REGION_DATA))for(const c of r.reader_hints.countries)countries.push({code:c.code,name:c.name,region:r.region_id,cur:c.currencies[0]});
const cname=c=>c.name==='Viet Nam'?'Vietnam':c.name;
const read=a=>readRegionContext(a);
const view=a=>read(a).regions.map(r=>[r.countries[0],r.vertical_id,r.subtype_id]);
const idx=(i,n)=>((i%n)+n)%n;
const full=text=>({product_description:text});
let n=0;
for(const [vi,[vid,prod,sub]] of V.entries()){
 for(const [ci,c] of countries.entries()){
  // a country from another region, with a currency, to deny, to bill in, or to host a headquarters
  const d=countries.filter(x=>x.region!==c.region&&x.cur)[idx(ci*7+vi,countries.filter(x=>x.region!==c.region&&x.cur).length)];
  const hq=countries.filter(x=>x.region!==c.region)[idx(ci*5+vi,countries.filter(x=>x.region!==c.region).length)];
  const C=cname(c),D=cname(d),H=cname(hq),o=OTHER[vi];
  const want=[[c.code,vid,sub]];
  const exact=`We sell ${prod} in ${C}.`;
  test(`${vid} ${c.code} exact`,()=>{assert.deepEqual(view(full(exact)),want);assert.deepEqual(read(full(exact)),read(full(exact)));});
  for(const [label,text,expect] of [
   ['same meaning, market first',`In ${C} we sell ${prod}.`,want],
   ['same meaning, buyers',`Our company sells ${prod} to buyers in ${C}.`,want],
   ['opposite',`We do not sell ${prod} in ${C}.`,[]],
   ['opposite inability',`We are unable to sell ${prod} in ${C}.`,[]],
   ['negated other market after',`We sell ${prod} in ${C}, but do not sell ${o} in ${D}.`,want],
   ['negated other market before',`We do not sell ${o} in ${D}. We sell ${prod} in ${C}.`,want],
   ['inability other market',`We sell ${prod} in ${C}. We are unable to sell ${prod} in ${D}.`,want],
   ['same market other product denied',`We sell ${prod} in ${C}. We do not sell ${o} in ${C}.`,want],
   ['same market other product denied first',`We do not sell ${o} in ${C}. We sell ${prod} in ${C}.`,want],
   ['headquarters only',`Our headquarters is in ${H}. We sell ${prod} in ${C}.`,want],
   ['vendor identity only',`We are a ${H} vendor. We sell ${prod} in ${C}.`,want],
   ['invoice currency of another country',`We sell ${prod} in ${C} and invoice in ${d.cur}.`,want],
   ['receipt account elsewhere',`We receive payments into our ${D} bank account and sell ${prod} in ${C}.`,want],
   ['headquarters, no destination',`Our headquarters is in ${H}. We do not sell ${prod} in ${C}.`,[]],
  ])test(`${vid} ${c.code} ${label}`,()=>{
   const got=view(full(text));assert.deepEqual(got,expect,text);
   const a=read(full(text)),b=read(full(text));assert.deepEqual(a,b);
  });
  if(ci%3===0)test(`${vid} ${c.code} two markets bound to their own offering`,()=>{
   const [,p2,s2]=[0,'lending software for banks','lending'];
   const text=`In ${C} we sell ${prod}; in ${D} we sell ${p2}.`;
   const got=view(full(text)),byC=Object.fromEntries(got.map(g=>[g[0],g]));
   assert.deepEqual(byC[c.code],[c.code,vid,vid==='fintech'?'lending':sub],text);
   assert.deepEqual(byC[d.code],[d.code,'fintech',s2],text);
   assert.equal(got.length,2);
  });
  n++;
 }
}
test('matrix size',()=>assert.ok(n>=9*31));
// Verbatim M2 findings, plus their reversed, equivalent and negated forms.
for(const [id,text,want] of [
 ['M077','We sell warehouse management software to warehouse operators in Singapore, but do not sell lending software in India.',[['SG','logistics-tech','warehousing']]],
 ['M077 reversed','We do not sell lending software in India, but we sell warehouse management software to warehouse operators in Singapore.',[['SG','logistics-tech','warehousing']]],
 ['M078','In Singapore we sell cybersecurity software; in India we sell lending software.',[['IN','fintech','lending'],['SG','cybersecurity',null]]],
 ['M078 reversed','In India we sell lending software; in Singapore we sell cybersecurity software.',[['IN','fintech','lending'],['SG','cybersecurity',null]]],
 ['M087','We sell payment gateway software in India but do not sell wealth management software in United Arab Emirates.',[['IN','fintech','payments-banking']]],
 ['M097','We are unable to sell lending software in India. We sell lending software in Singapore.',[['SG','fintech','lending']]],
 ['M097 positive','We can sell lending software in India.',[['IN','fintech','lending']]],
 ['M098','We sell lending software in India and invoice in Singapore dollars.',[['IN','fintech','lending']]],
 ['M098 denied','We do not sell lending software in India and invoice in Singapore dollars.',[]],
 ['M106','We receive payment in an India bank account and sell lending software in Singapore.',[['SG','fintech','lending']]],
 ['M107','We sell lending software in India but do not sell payment gateway software in India.',[['IN','fintech','lending']]],
 ['M107 reversed','We do not sell payment gateway software in India. We sell lending software in India.',[['IN','fintech','lending']]],
 ['M107 same product denied','We sell lending software in India but do not sell lending software in India.',[]],
 ['M108','Our headquarters is in Singapore. We sell lending software in India.',[['IN','fintech','lending']]],
 ['M108 vendor','We are a Singapore vendor. We do not sell lending software to a London bank.',[]],
 ['M108 both','Our headquarters is in Singapore. We sell lending software in India. Also: We are a Singapore vendor. We do not sell lending software to a London bank.',[['IN','fintech','lending']]],
 ['M108 selling in HQ country','Our headquarters is in Singapore. We sell lending software in Singapore.',[['SG','fintech','lending']]],
])test('M2 verbatim '+id,()=>{assert.deepEqual(view(full(text)),want,text);assert.deepEqual(read(full(text)),read(full(text)));});
