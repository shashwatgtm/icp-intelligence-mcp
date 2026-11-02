import test from 'node:test';
import assert from 'node:assert/strict';
import {readRegions,regionNotes,regionInputTexts} from '../dist/region-reader.js';
import {REGIONS,REGION_SOURCES,SECTOR_REGION_NOTES} from '../dist/regions.js';
const cases=[['India','Indian banks','india','india'],['Southeast Asia','ASEAN','southeast-asia',null],['Middle East','GCC','middle-east',null],['United Kingdom','UK','united-kingdom','uk'],['Europe','European market','europe',null],['United States','USA','united-states','usa']];
for(const [exact,same,id,j]of cases){
 test('Exact and same meaning: '+id,()=>{for(const p of [exact,same])assert.deepEqual(readRegions(['We serve buyers in '+p+'.']),[{region:id,jurisdictions:j?[j]:[]}]);});
 test('Opposite and uncertainty: '+id,()=>{for(const p of [`We do not serve buyers in ${exact}.`,`${exact} is not a target market.`,`We might enter ${exact}.`,`Should we enter ${exact}?`,`We exited ${exact}.`,`We serve buyers outside ${exact}.`,`Our rival sells in ${exact}.`])assert.deepEqual(readRegions([p]),[],p);});
}
for(const [p,id,j]of [['Germany','europe','germany'],['Singapore','southeast-asia','singapore'],['UAE','middle-east','uae'],['Saudi Arabia','middle-east','saudi'],['California','united-states','california'],['European Union','europe','eu']])test('Country scope '+p,()=>{assert.deepEqual(readRegions(['We sell in '+p]),[{region:id,jurisdictions:[j]}]);assert.deepEqual(readRegions(['We do not sell in '+p]),[]);});
test('Country contrasts stay local',()=>{
 assert.deepEqual(readRegions(['We sell in India, not Germany.']),[{region:'india',jurisdictions:['india']}]);
 assert.deepEqual(readRegions(['We do not sell in India, but we sell in Germany.']),[{region:'europe',jurisdictions:['germany']}]);
 assert.deepEqual(readRegions(['We sell in India and Germany.']),[{region:'india',jurisdictions:['india']},{region:'europe',jurisdictions:['germany']}]);
 assert.deepEqual(readRegions(['We target neither India nor Germany.']),[]);
 assert.deepEqual(readRegions(['India and Germany are not target markets.']),[]);
});
test('Contradictory or uncertain scope fails closed',()=>{
 assert.deepEqual(readRegions(['We sell in India.','India is not a target.']),[]);
 assert.deepEqual(readRegions(['We sell in India.','We might enter India.']),[]);
 assert.deepEqual(readRegions(['We serve Germany.','Europe is excluded.']),[]);
});
test('No inference from names, quotes, currency, stack or data source',()=>{
 const args={company:'India Company',customers:[{name:'Germany',champion_title:'US director',tech_stack:['Singapore'],buying_trigger:'UAE',location:'India'}],data_sources:'US census',interview_notes:[{key_quotes:['We serve Germany']}],deal_size:'USD',description:'Tell us about approval'};
 assert.deepEqual(regionInputTexts(args),['India','Tell us about approval']);
 assert.equal(regionNotes({company:'India',data_sources:'Germany',product_category:'Tell us about security',deal_size:'USD'}),'');
});
test('Serialized context only reads location fields',()=>{
 assert.deepEqual(regionInputTexts({customer_descriptions:JSON.stringify([{name:'Germany',location:'India'}])}),['India']);
 assert.deepEqual(readRegions(regionInputTexts({icp_firmographics:{locations:['India','Germany']}})),[{region:'india',jurisdictions:['india']},{region:'europe',jurisdictions:['germany']}]);
});
test('Broad regions never import specific country law',()=>{
 for(const p of ['Europe','Southeast Asia','Middle East']){
 const output=regionNotes({product_category:'Bank reconciliation software. We sell in '+p});
 assert.match(output,/Name the contracting country/);assert.doesNotMatch(output,/GDPR|DORA|PDPA|MAS Notice|Decree Law|Personal Data Protection Law/);
 }
});
test('India and Germany fintech notes differ in the sourced rule',()=>{
 const input=country=>({product_category:`Fintech payment software for banks in ${country}`});
 const india=regionNotes(input('India')),germany=regionNotes(input('Germany'));
 assert.match(india,/Reserve Bank of India/);assert.doesNotMatch(india,/DORA|BDSG/);
 assert.match(germany,/DORA/);assert.match(germany,/BDSG/);assert.doesNotMatch(germany,/Reserve Bank of India/);
 assert.equal(germany,regionNotes(input('Germany')));
});
test('Negated fintech category does not add financial regulation',()=>{
 assert.doesNotMatch(regionNotes({product_category:'We sell cybersecurity software, not fintech. We serve India.'}),/Reserve Bank of India/);
});
test('Source integrity and fixed dates',()=>{
 const ids=new Set(REGION_SOURCES.map(s=>s.id));assert.equal(ids.size,REGION_SOURCES.length);
 for(const s of REGION_SOURCES){assert.match(s.url,/^https:\/\//);assert.equal(s.checked,'2026-11-02');assert.ok(s.published);}
 for(const n of SECTOR_REGION_NOTES)for(const id of n.sources)assert.ok(ids.has(id));
 assert.equal(REGIONS.length,6);
});
