import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFileSync,existsSync} from 'node:fs';
const root=resolve(process.env.REGION_TEST_REPO||(existsSync('src/region-reader.ts')?'.':'icp'));
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const mode=pkg.name.includes('gtm-alpha')?'netlify/lib':pkg.type==='module'?'dist':'src';
const modulePath=name=>resolve(root,mode,name+(mode==='src'?'.ts':'.js'));
const {readRegionContext,regionNotes,NO_REGION_SUFFIX}=await import(pathToFileURL(modulePath('region-reader')));
const {REGION_CHOICES,REGION_TAXONOMY}=await import(pathToFileURL(modulePath('regions')));
const ids=args=>readRegionContext(args).regions.map(r=>r.region_id);
const seller=text=>({product_description:text});
const jurisdictionIds=args=>readRegionContext(args).regions.flatMap(r=>r.jurisdictions).sort();
for(const [name,text,want] of [
 ['M062 exclusion list','We sell lending software in Singapore. Excluded markets: India, Indonesia and Malaysia.',['SG']],
 ['M063 stopped market','We stopped selling lending software in India. We now sell in Singapore.',['SG']],
 ['M064 historical contrast','We used to sell lending software in India but now only sell in Singapore.',['SG']],
 ['M065 conditional market','We sell lending software in Singapore. If we enter India, we will review the rules.',['SG']],
 ['M066 named company','We sell lending software in India. The company is called Singapore Systems.',['IN']],
 ['M067 company suffix','Singapore Systems is our company name. We sell lending software in India.',['IN']],
 ['M068 reference customer','We sell lending software. Our reference customer is a Singapore bank.',[]],
 ['M069 cloud vendor','We sell lending software. Our cloud vendor is in Singapore.',[]],
 ['M070 billing currency','We sell lending software in Singapore and invoice in GBP.',['SG']],
 ['ceased equivalent','We ceased selling lending software in India. We sell in Singapore.',['SG']],
 ['past opposite','We used to sell lending software in Singapore but now only sell in India.',['IN']],
 ['conditional opposite','We sell lending software in India. If we enter Singapore, we will review the rules.',['IN']],
 ['excluded opposite','We sell lending software in India. Excluded countries: Singapore and Indonesia.',['IN']],
 ['active selling','We sell lending software in India and Singapore.',['IN','SG']],
 ['reference opposite','We sell lending software to a Singapore bank.',['SG']],
 ['vendor opposite','We sell cloud software in Singapore.',['SG']],
 ['market currency retained','We sell lending software in a market using GBP.',['GB']],
 ['billing preceding market','We invoice in GBP and sell lending software in Singapore.',['SG']],
 ['billing followed by second market','We sell in Singapore and invoice in GBP but sell in India too.',['IN','SG']],
 ['billing only','We sell lending software and invoice in GBP.',[]],
])test(`Market role and tense: ${name}`,()=>{
 const readings=Array.from({length:3},()=>readRegionContext(seller(text)));
 assert.deepEqual(jurisdictionIds(seller(text)),want,text);
 assert.deepEqual(readings[1],readings[0]);assert.deepEqual(readings[2],readings[0]);
});
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

// Explicit sector selection must agree with the core tool.
{
const input={product_description:'Cybersecurity threat detection software sold in India'};
for(const v of REGION_TAXONOMY.verticals)test(`explicit sector ${v.id} wins`,()=>{
 const match=readRegionContext({...input,your_sector:v.id.replaceAll('-','_')}).regions[0];
 assert.equal(match.vertical_id,v.id);
 if(v.id!=='cybersecurity')assert.equal(match.subtype_id,null);
});
test('explicit other keeps regional industry neutral',()=>{
 const match=readRegionContext({...input,your_sector:'other'}).regions[0];
 assert.equal(match.vertical_id,null);assert.equal(match.subtype_id,null);
 assert.doesNotMatch(regionNotes({...input,your_sector:'other'}),/Industry: Cybersecurity/);
});
for(const value of [undefined,null,42,'unknown',{},['fintech']])test(`invalid selector ${JSON.stringify(value)} preserves inference`,()=>{
 assert.equal(readRegionContext({...input,your_sector:value}).regions[0].vertical_id,'cybersecurity');
});
test('buyer nested selector cannot override seller choice',()=>{
 assert.equal(readRegionContext({...input,target_customer:{your_sector:'fintech'}}).regions[0].vertical_id,'cybersecurity');
});
test('matching choice preserves evidenced subtype',()=>{
 const args={product_description:'Lending origination software sold in India'};
 const inferred=readRegionContext(args).regions[0];
 assert.equal(inferred.vertical_id,'fintech');
 assert.equal(readRegionContext({...args,your_sector:'fintech'}).regions[0].subtype_id,inferred.subtype_id);
});

}

// M021 to M029, Lane I comma scope and Lane K office destination findings.
for(const [description,expected] of [
 ['We do not sell banking, lending or payments software in India. We sell lending software in Singapore.',['SG']],
 ['We do not sell core banking software in Singapore, Indonesia or Malaysia. We sell in India.',['IN']],
 ['We sell lending software in India. A competitor sells banking, lending and payments software in Singapore.',['IN']],
 ['We sell lending software in Singapore. India, Thailand and Malaysia were our previous markets.',['SG']],
 ['We serve India from Singapore with payment software.',['IN']],
 ['We sell payment software into the United Kingdom from India.',['GB']],
 ['We sell payment software from India into the United Kingdom.',['GB']],
 ['We may sell banking, lending and payments software in India. We sell in Singapore.',['SG']],
 ['We formerly sold banking, lending and payments software in India. We sell in Singapore.',['SG']],
 ['We sell in India, Singapore and Malaysia.',['IN','MY','SG']],
 ['We do not sell in India, but we sell in Singapore.',['SG']],
 ['We do not sell in India, we sell in Singapore.',['SG']],
 ['We do not sell in India and we sell in Singapore.',['SG']],
 ['India, Thailand and Malaysia could be next year. We sell in Singapore.',['SG']],
 ['India, Thailand and Malaysia are competitor markets. We sell in Singapore.',['SG']],
 ['We sell in Singapore and India, not Malaysia.',['IN','SG']],
 ['We sell in Singapore, not India or Malaysia.',['SG']],
])test(description,()=>assert.deepEqual(readRegionContext({product_description:description}).regions.flatMap(r=>r.countries).sort(),expected));

// Lane L product feature polarity and nongeographic source phrases.
for(const [text,expected] of [
 ['We sell An intelligent document processing platform that extracts data from invoices and forms in India.',['IN']],
 ['We sell Open source database support and consulting with no license fees in India.',['IN']],
 ['We sell software with no downtime in India.',['IN']],
 ['We sell software without manual setup in India.',['IN']],
 ['We sell software that does not require a server in India.',['IN']],
 ['We sell no software in India. We sell in Singapore.',['SG']],
 ['We have no customers in India. We sell in Singapore.',['SG']],
 ['We do not sell banking, lending or payments software in India. We sell in Singapore.',['SG']],
 ['We sell software from Singapore suppliers in India.',['IN']],
 ['We sell software from our office in Singapore into India.',['IN']],
 ['We sell software from India and Singapore into the UK.',['GB']],
 ['We sell software from invoices and forms into the UK.',['GB']],
])test(text,()=>assert.deepEqual(readRegionContext({product_description:text}).regions.flatMap(r=>r.countries).sort(),expected));

for(const row of fixture.rows.filter(r=>r.subtype&&r.subtype!=='billing-revenue'))test(`inline market preserves subtype ${row.id}`,()=>{
 for(const [country,code] of [['India','IN'],['Singapore','SG'],['Saudi Arabia','SA'],['United Kingdom','GB'],['Germany','DE'],['Canada','CA']]){
  const args={product_description:`We sell ${row.text} in ${country}.`};
  const result=readRegionContext(args);assert.equal(result.regions.length,1,country);
  const match=result.regions[0];assert.deepEqual(match.countries,[code],row.text);
  assert.equal(match.vertical_id,row.sector);assert.equal(match.subtype_id,row.subtype);
  for(let run=1;run<3;run++)assert.deepEqual(readRegionContext(args),result);
 }
});

// Source postal addresses and single quoted evidence retain actor boundaries.
for(const [text,expected] of [
 ['We sell software from London, Ontario, Canada into India.',['IN']],
 ['We sell software in India from our London, Ontario, Canada office.',['IN']],
 ['We sell software from a vendor in London, Ontario, Canada to India.',['IN']],
 ["We sell software in India. A customer said 'Singapore is next'.",['IN']],
 ['We sell software in India. A customer said ‘Singapore is next’.',['IN']],
 ["We don't sell software in India. We sell in Singapore.",['SG']],
 ["We sell software for customers' accounts in India.",['IN']],
 ['We sell software from invoices and forms in India.',['IN']],
 ['We sell software from Singapore suppliers in India.',['IN']],
])test(text,()=>assert.deepEqual(readRegionContext({product_description:text}).regions.flatMap(r=>r.countries).sort(),expected));

// Lane P: seller offerings, market exclusions and transaction geography.
for(const [name,text,expected] of [
 ['M077 denied first','We do not sell lending software in India. We sell warehouse management software to warehouse operators in Singapore.',[['SG','logistics-tech','warehousing']]],
 ['M077 denied last','We sell warehouse management software to warehouse operators in Singapore. We do not sell lending software in India.',[['SG','logistics-tech','warehousing']]],
 ['M078 two offerings','We sell lending software in India. We sell managed SOC services in Singapore.',[['IN','fintech','lending'],['SG','cybersecurity','soc-services']]],
 ['M078 opposite order','We sell managed SOC services in Singapore. We sell lending software in India.',[['IN','fintech','lending'],['SG','cybersecurity','soc-services']]],
 ['M087 denied wealth','We do not sell wealth management software in United Arab Emirates. We sell payments software in India.',[['IN','fintech',null]]],
 ['M087 two fintech products','We sell wealth management software in United Arab Emirates. We sell payments software in India.',[['IN','fintech',null],['AE','fintech','wealth-investment']]],
 ['M097 inability','We sell lending software in India. We cannot sell in Singapore.',[['IN','fintech','lending']]],
 ['M098 denomination','We sell lending software in Singapore under contracts denominated in INR.',[['SG','fintech','lending']]],
 ['M098 receipt account','We sell lending software in Singapore. We receive payments into our India bank account.',[['SG','fintech','lending']]],
 ['M099 membership','We sell lending software in the UK. The UK is not an EU member.',[['GB','fintech','lending']]],
])test(`Lane P ${name}`,()=>{
 const args={product_description:text};
 const result=readRegionContext(args);
 const actual=result.regions.map(r=>[r.countries[0],r.vertical_id,r.subtype_id]);
 assert.deepEqual(actual,expected);
 for(let i=0;i<2;i++)assert.deepEqual(readRegionContext(args),result);
});
test('M086 frozen crisis industry fixes regional vertical',()=>{
 const match=readRegionContext({industry:'vertical_saas',potential_crises:'We sell HR and payroll built for one industry in India. The potential crisis is a service outage.'}).regions[0];
 assert.equal(match.vertical_id,'vertical-saas');
});

for(const text of ['We sell lending software in Singapore under contracts denominated in INR and we sell managed SOC services in India.','We sell lending software in Singapore and receive payments into our India bank account but we sell managed SOC services in the UK.'])test('Transaction geography preserves later affirmative sales: '+text,()=>{
 const result=readRegionContext({product_description:text});
 const expected=text.includes('in the UK')?['GB','SG']:['IN','SG'];assert.deepEqual(result.regions.flatMap(r=>r.countries).sort(),expected);
});

for(const text of ['We sell lending software in India and managed SOC services in Singapore.','We sell managed SOC services in Singapore and lending software in India.'])test('M078 one sentence keeps country offerings separate: '+text,()=>{
 assert.deepEqual(readRegionContext({product_description:text}).regions.map(r=>[r.countries[0],r.vertical_id,r.subtype_id]),[['IN','fintech','lending'],['SG','cybersecurity','soc-services']]);
});

for(const [text,expected] of [
 ['We receive payments into our India bank account and sell lending software in Singapore.',['SG']],
 ['We receive payments into our India bank account and we sell lending software in Singapore.',['SG']],
 ['We sell lending software in India. We do not sell payment gateway software in India.',['IN']],
 ['We do not sell payment gateway software in India. We sell lending software in India.',['IN']],
 ['We sell lending software in India and we do not sell payment gateway software in India.',['IN']],
 ['We sell lending software in India. We do not sell lending software in India.',[]],
 ['We sell lending software in India. We do not sell in India.',[]],
 ['We sell lending software in India. Excluded markets: India.',[]],
])test('M106/M107 offering and transaction boundary: '+text,()=>{
 const args={product_description:text},result=readRegionContext(args);
 assert.deepEqual(result.regions.flatMap(r=>r.countries).sort(),expected);
 if(expected.length)assert.equal(result.regions[0].subtype_id,'lending');
 assert.deepEqual(readRegionContext(args),result);assert.deepEqual(readRegionContext(args),result);
});
