import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFileSync,existsSync} from 'node:fs';
const root=resolve(process.env.REGION_TEST_REPO||(existsSync('src/region-reader.ts')?'.':'icp'));
const mode=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).type==='module'?'dist':'src';
const modulePath=name=>resolve(root,mode,name+(mode==='dist'?'.js':'.ts'));
const {readRegionContext,regionNotes,NO_REGION_SUFFIX}=await import(pathToFileURL(modulePath('region-reader')));
const {REGION_CHOICES,REGION_TAXONOMY}=await import(pathToFileURL(modulePath('regions')));
const ids=args=>readRegionContext(args).regions.map(r=>r.region_id);
const seller=text=>({product_description:text});
for(const r of REGION_CHOICES){
 test(`${r.name}: affirmative and opposite`,()=>{
  assert.deepEqual(ids(seller(`Payment reconciliation software sold in ${r.name}`)),[r.id]);
  for(const text of [`We do not sell in ${r.name}`,`We don't sell in ${r.name}`,`We formerly sold in ${r.name}`,`We may sell in ${r.name}`,`${r.name} is not our market`,`Should we sell in ${r.name}?`])assert.deepEqual(ids(seller(text)),[],text);
 });
}
for(const [id,clues] of Object.entries({india:['India','Bengaluru','INR','Reserve Bank of India'], 'southeast-asia':['Singapore','Jakarta','SGD','Monetary Authority of Singapore'],'middle-east':['Saudi Arabia','Dubai','AED','Saudi Central Bank'],uk:['United Kingdom','U.K.','GBP','Financial Conduct Authority'],'western-europe':['Germany','Munich','BaFin'], 'north-america':['United States','U.S.','US','Toronto','CAD']})){
 for(const clue of clues)test(`equivalent clue ${clue}`,()=>assert.deepEqual(ids(seller(`Payment software sold in ${clue}`)),[id]));
}
test('no geography is exactly the shared question suffix',()=>assert.equal(regionNotes(seller('Payment reconciliation software')),NO_REGION_SUFFIX));
test('seller market wins over buyer geography',()=>assert.deepEqual(ids({product_description:'Payment software sold in India',target_customer:'Banks in Germany'}),['india']));
test('explicit negative seller market prevents buyer fallback',()=>assert.deepEqual(ids({product_description:'We do not sell in India',target_customer:'Banks in Germany'}),[]));
test('uncertain seller market prevents buyer fallback',()=>assert.deepEqual(ids({product_description:'We may sell in India',target_customer:'Banks in Germany'}),[]));
test('buyer geography alone does not establish seller market',()=>assert.deepEqual(ids({product_description:'Payment software',target_customer:'Banks in Germany'}),[]));
test('two real markets are retained',()=>assert.deepEqual(ids(seller('Payment software sold in India and Germany')),['india','western-europe']));
test('group negation excludes both markets',()=>assert.deepEqual(ids(seller('India and Germany are not our markets')),[]));
test('positive contrast does not resurrect a negative market',()=>assert.deepEqual(ids(seller('We do not sell in India but sell in Germany')),['western-europe']));
test('seller sector wins over buyer sector',()=>assert.equal(readRegionContext({product_description:'Freight visibility software in India',target_customer:'Banks in Germany'}).regions[0].vertical_id,'logistics-tech'));
test('buyer sector does not silently become seller sector',()=>assert.equal(readRegionContext({target_customer:'Banks in India',seller_market:'India'}).regions[0].vertical_id,null));
test('names, quotes and rival claims cannot become region evidence',()=>assert.deepEqual(ids({company_name:'India Systems',competitors:['Germany'],quotes:['We sell in Canada'],known_stakeholders:[{name:'India',role:'Canada lead'}]}),[]));
for(const clue of ['USD','EUR','Paris','Birmingham','Cambridge','Georgia','SEC','APAC','EMEA','Europe'])test(`ambiguous ${clue} requires clarification`,()=>assert.deepEqual(ids(seller(`We sell in ${clue}`)),[]));
test('pronoun us is not a country',()=>assert.deepEqual(ids(seller('Customers pay us for software')),[]));
test('structured JSON strings keep the same reading',()=>assert.deepEqual(ids(JSON.stringify(seller('Payment software in India'))),['india']));
const {SUBTYPES}=await import(pathToFileURL(modulePath('verticals')));
const fixture=JSON.parse(readFileSync(resolve(root,'tests/fixtures/run21-subtype-table.json'),'utf8'));
for(const row of fixture.rows.filter(r=>r.subtype&&r.subtype!=='billing-revenue'))test(`subtype ${row.id} remains ${row.subtype}`,()=>{
 const match=readRegionContext({product_description:row.text,seller_market:'India'}).regions[0];
 assert.equal(match.vertical_id,row.sector);assert.equal(match.subtype_id,row.subtype);
});
test('taxonomy covers the exported source subtype list exactly',()=>assert.deepEqual(REGION_TAXONOMY.subtypes.map(s=>s.id).sort(),SUBTYPES.map(s=>s.id).sort()));
// billing-revenue is a legacy use-case profile, not an exported SUBTYPES entry.
test('billing keeps SaaS context without inventing a subtype ID',()=>{const m=readRegionContext({product_description:'Subscription billing software',seller_market:'India'}).regions[0];assert.equal(m.vertical_id,'saas');assert.equal(m.subtype_id,null);});

test('destination wins over seller headquarters',()=>assert.deepEqual(ids(seller('A seller based in India selling into the UK')),['uk']));
test('market field wins over product location',()=>assert.deepEqual(ids({product_description:'Payment software in India',target_market:'UK'}),['uk']));
test('London market reads as UK',()=>assert.deepEqual(ids(seller('Payment software selling to London banks')),['uk']));
test('two countries in one region remain separate',()=>assert.deepEqual(readRegionContext(seller('Payment software selling in Singapore and Indonesia')).regions.map(r=>r.countries),[['SG'],['ID']]));
const {REGION_DATA}=await import(pathToFileURL(modulePath('regions')));
const fields=['decision_approvers','sector_regulator','procurement_payment','data_privacy','buyer_language','proof','objections','sales_motion'];
function withScopeFixture(fn){
 const empty=()=>Object.fromEntries(fields.map(f=>[f,[]]));
 const note=(text,jurisdictions)=>({text,kind:'question',source_ids:[],jurisdictions,applies_when:''});
 const make=(region_id,countries,notes)=>({schema_version:'1.0.0',region_id,region_name:REGION_CHOICES.find(r=>r.id===region_id).name,review_status:'draft',updated_at:'2026-11-03',scope_note:'Synthetic scope fixture',reader_hints:{aliases:[],countries:countries.map(([code,name])=>({code,name,aliases:[],cities:[],currencies:[],regulators:[]}))},defaults:{...empty(),proof:notes.map(n=>note(...n))},verticals:[],subtypes:[]});
 const original=REGION_DATA.splice(0);
 REGION_DATA.push(make('southeast-asia',[['SG','Singapore'],['ID','Indonesia']],[['COMMON_CHECK',[]],['SINGAPORE_CHECK',['SG']],['INDONESIA_CHECK',['ID']]]),make('western-europe',[['DE','Germany'],['CH','Switzerland']],[['EU_CHECK',['EU']],['GERMANY_CHECK',['DE']],['SWITZERLAND_CHECK',['CH']]]),make('north-america',[['US','United States'],['CA','Canada']],[['US_CHECK',['US']],['US_CALIFORNIA_CHECK',['US-CA']],['CANADA_CHECK',['CA']]]));
 try{fn();}finally{REGION_DATA.splice(0,REGION_DATA.length,...original);}
}
test('broad region omits country claims and asks for country',()=>withScopeFixture(()=>{
 const output=regionNotes(seller('Payment software sold in Southeast Asia'));
 assert.match(output,/COMMON_CHECK/);assert.doesNotMatch(output,/SINGAPORE_CHECK|INDONESIA_CHECK/);assert.match(output,/Which buyer country applies/);
}));
test('Singapore cannot inherit Indonesia context',()=>withScopeFixture(()=>{
 const output=regionNotes(seller('Payment software sold in Singapore'));
 assert.match(output,/SINGAPORE_CHECK/);assert.doesNotMatch(output,/INDONESIA_CHECK/);
}));
test('same region markets render in separate labelled sections',()=>withScopeFixture(()=>{
 const output=regionNotes(seller('Payment software sold in Singapore and Indonesia'));
 const sg=output.split('### Southeast Asia · Singapore')[1].split('### Southeast Asia · Indonesia')[0];
 const id=output.split('### Southeast Asia · Indonesia')[1];
 assert.match(sg,/SINGAPORE_CHECK/);assert.doesNotMatch(sg,/INDONESIA_CHECK/);assert.match(id,/INDONESIA_CHECK/);assert.doesNotMatch(id,/SINGAPORE_CHECK/);
}));
test('Switzerland gets neither EU nor German rules',()=>withScopeFixture(()=>{
 const output=regionNotes(seller('Payment software sold in Switzerland'));assert.match(output,/SWITZERLAND_CHECK/);assert.doesNotMatch(output,/EU_CHECK|GERMANY_CHECK/);
}));
test('US national input does not receive a California rule',()=>withScopeFixture(()=>{
 const output=regionNotes(seller('Payment software sold in the United States'));assert.match(output,/US_CHECK/);assert.doesNotMatch(output,/US_CALIFORNIA_CHECK|CANADA_CHECK/);
}));
test('California input gets applicable state and national notes only',()=>withScopeFixture(()=>{
 const output=regionNotes(seller('Payment software sold in California, United States'));assert.match(output,/US_CHECK/);assert.match(output,/US_CALIFORNIA_CHECK/);assert.doesNotMatch(output,/CANADA_CHECK/);
}));
for(const [id,input,expected] of [
 ['M001','We are based in India and sell lending software into the UK.',['uk']],
 ['M002','A London bank is buying our lending software from our Singapore office.',['uk']],
 ['M003','We sell lending software in India; Singapore is a competitor location.',['india']],
 ['M004','We sell lending software in India. Our company name is London Cloud.',['india']],
 ['M006','We sell lending software in California, United States, not New York.',['north-america']],
 ['M007','We sell lending software in California.',['north-america']],
 ['M009','We sell lending software in India. A customer said "Singapore is next".',['india']],
 ['M010','We sell lending software in the UK. India was our previous market.',['uk']],
 ['M011','We sell lending software in India. Singapore could be next year.',['india']],
 ['J001','We sell lending software in London, Ontario, Canada.',['north-america']],
 ['J002','We sell lending software in New Mexico, United States.',['north-america']],
])test(`Independent finding ${id}`,()=>assert.deepEqual(ids(seller(input)),expected));
for(const [id,input] of [['M005','We sell lending software in the United States except California.'],['M008','We sell lending software in the United States, but not in California.']])test(`Independent finding ${id}: state exclusions`,()=>withScopeFixture(()=>{
 const output=regionNotes(seller(input));assert.match(output,/US_CHECK/);assert.doesNotMatch(output,/US_CALIFORNIA_CHECK/);
}));
test('M006: New York exclusion preserves affirmative California',()=>withScopeFixture(()=>{
 const match=readRegionContext(seller('We sell lending software in California, United States, not New York.')).regions[0];assert.deepEqual(match.jurisdictions,['US','US-CA']);
}));

// Additional seller destination wording found during Lane G review.
for(const [description,expected] of [
 ['A Singapore vendor serves banks in the UK.',['uk']],
 ['Singapore based lending software serving London banks.',['uk']],
 ['A Singapore vendor targets banks in the UK.',['uk']],
 ['A Singapore vendor is targeting London banks.',['uk']],
 ['We are based in India and sell a complete lending operations platform with application review and decision records and repayment tracking into the UK.',['uk']],
 ['Our Singapore office does not serve UK banks.',[]],
 ['Our Singapore competitor serves banks in the UK.',[]],
 ['Our Singapore vendor may target banks in the UK.',[]],
])test(description,()=>assert.deepEqual(readRegionContext({product_description:description}).regions.map(r=>r.region_id),expected));
