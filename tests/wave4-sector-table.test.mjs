import {pathToFileURL as dynamicTestURL} from 'node:url';
const importPortableTest=specifier=>import(typeof specifier==='string'&&/^[A-Za-z]:[\\/]/.test(specifier)?dynamicTestURL(specifier).href:specifier);
import test from 'node:test';import assert from 'node:assert/strict';
const {detectVertical}=await importPortableTest((process.env.WAVE4_TEST_HOME||process.cwd())+'/dist/verticals.js');
const cases=[['logistics-tech','Logistics tech'],['fintech','Fintech'],['saas','SaaS'],['vertical-saas','Vertical SaaS'],['ai-native','AI native'],['ites','ITeS'],['telecom','Telecom'],['software','Software'],['cybersecurity','Cybersecurity']];
for(const [id,label]of cases)test('C12 sector '+label+' exact, same meaning and opposite',()=>{
 for(const seller of [label,'We are a '+label+' vendor for banks'])assert.equal(detectVertical({seller:[seller],buyer:['banks']})?.id,id,seller);
 for(const seller of ['We are not a '+label+' vendor for banks',label+' is not our sector'])assert.equal(detectVertical({seller:[seller],buyer:['banks']}),null,seller);
});
