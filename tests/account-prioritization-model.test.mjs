import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
import {computeAccountPrioritization,accountWidgetResult} from '../src/account-prioritization.ts';
const base=fs.readFileSync(new URL('./fixtures/account-prioritization-baseline.ts',import.meta.url),'utf8');
const candidate=fs.readFileSync(new URL('../src/index.ts',import.meta.url),'utf8');
const offset=base.indexOf('account_prioritization:');const start=base.indexOf('      // Default weights',offset),end=base.indexOf('        const sv = ctx.v;',start);
const strip=await import('node:module');
const source=strip.stripTypeScriptTypes('function reference(args:any){'+base.slice(start,end)+`return {weights,noWeights,W,tierA,tierB,tierC,scoredAccounts:scoredAccounts.map((a,i)=>({...a,reason:reasonFor(a),nextAction:i<5?nextStep(a):null,weakest:weakestOf(a)}))};} return null;}`);
const ref=vm.runInNewContext(source+';reference',{EXAMPLE:'example',cleanNum1:n=>(Math.round(n*10)/10+0).toLocaleString('en-US',{maximumFractionDigits:1}),cleanPct:n=>(Math.round(n*10)/10+0).toLocaleString('en-US',{maximumFractionDigits:1})+'%'});
const simple=v=>JSON.parse(JSON.stringify(v));
test('baseline source Git blob identity matches pinned current main',()=>{const b=fs.readFileSync(new URL('./fixtures/account-prioritization-baseline.ts',import.meta.url));assert.equal(crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),'57bed3ac74874b7f0fc86b6073fca91f307a1681');});
test('legacy formatter templates remain exact source bytes',()=>{for(const marker of ['return `# Account Prioritization Results','return `# Account Prioritization Framework']){const a=base.slice(base.indexOf(marker),base.indexOf('`;',base.indexOf(marker))+2);const b=candidate.slice(candidate.indexOf(marker),candidate.indexOf('`;',candidate.indexOf(marker))+2);assert.equal(b,a);}});
const cases=[
['ordinary',{accounts:[{name:'Row 1',fit_score:80,intent_signals:60,relationship:40,timing:'now'},{name:'Row 2',fit_score:40,intent_signals:50,relationship:50,timing:'soon'}]}],
['defaults',{accounts:[{name:'Row 1'}]}],
['zeros',{accounts:[{name:'Row 1',fit_score:0,intent_signals:0,relationship:0,timing:'later'}],prioritization_weights:{fit:0,intent:0,relationship:0,timing:100}}],
['weights200',{accounts:[{name:'Row 1',fit_score:80,intent_signals:60,relationship:40,timing:'now'}],prioritization_weights:{fit:80,intent:60,relationship:30,timing:30}}],
['fractional',{accounts:[{name:'Row 1'}],prioritization_weights:{fit:33.3,intent:33.3,relationship:33.3,timing:.1}}],
['timing',{accounts:[{name:'Row 1',timing:' now '},{name:'Row 2',timing:'NOW'},{name:'Row 3',timing:'unexpected'}]}],
['duplicates',{accounts:Array.from({length:7},()=>({name:'Same'}))}],
['negative',{accounts:[{name:'Row 1'}],prioritization_weights:{fit:-40,intent:60,relationship:30,timing:30}}],
['overflow',{accounts:[{name:'Row 1'}],prioritization_weights:{fit:1e308,intent:1e308,relationship:1e308,timing:1e308}}],
['nulls',{accounts:[{name:'Row 1',fit_score:null,intent_signals:null,relationship:null,timing:null}],prioritization_weights:{fit:null}}],
['literal',{accounts:[{name:'<text> & é',timing:'<script>now</script>'}]}]
];
for(const[name,args]of cases)test('original computation and reason differential: '+name,()=>{const a=simple(ref(args)),m=computeAccountPrioritization(args);const b=simple({weights:m.weights,noWeights:m.noWeights,W:m.W,tierA:m.tierA,tierB:m.tierB,tierC:m.tierC,scoredAccounts:m.scoredAccounts.map(({inputIndex,rank,id,contributions,...row})=>row)});assert.deepEqual(b,a);});
test('independent arithmetic and default oracle',()=>{const m=computeAccountPrioritization(cases[0][1]);assert.equal(m.scoredAccounts[0].totalScore,71);assert.equal(m.scoredAccounts[0].tier,'B');assert.equal(m.scoredAccounts[1].totalScore,49);assert.deepEqual(m.scoredAccounts[0].contributions,{fit:32,intent:18,relationship:6,timing:15});assert.equal(computeAccountPrioritization({accounts:[{}]}).scoredAccounts[0].totalScore,50);});
test('package arithmetic retained with neutral row labels: 71 and 48',()=>{const m=computeAccountPrioritization({accounts:[{name:'Row 1',fit_score:80,intent_signals:60,relationship:40,timing:'now'},{name:'Row 2',fit_score:60,intent_signals:50,relationship:20,timing:'later'}],prioritization_weights:{fit:40,intent:30,relationship:15,timing:15}});assert.deepEqual(m.scoredAccounts.map(a=>[a.totalScore,a.tier]),[[71,'B'],[48,'C']]);});
test('no-account mode has no fabricated ranking',()=>{const m=computeAccountPrioritization({});assert.equal(m.mode,'framework');assert.deepEqual(m.scoredAccounts,[]);});
test('negative and overflowing weights are explicit additive warnings',()=>{for(const name of ['negative','overflow']){const args=cases.find(x=>x[0]===name)[1];const r=accountWidgetResult(computeAccountPrioritization(args),args,args,'legacy');assert.ok(r.structuredContent.warnings.length);if(name==='overflow'){assert.equal(r.structuredContent.result.rangeSupported,false);assert.equal(r.structuredContent.result.maximum,null);}}});
test('component-only allowlist survives three literal round trips',()=>{let a={accounts:[{name:'<B> & é \\',timing:' now ',fit_score:0}],company:'<C>',unrelated:'excluded'};for(let i=0;i<3;i++){const result=accountWidgetResult(computeAccountPrioritization(a),a,a,'legacy');const back=JSON.parse(Buffer.from(result._meta.helixAccountPrioritization.inputsBase64,'base64').toString());assert.equal(back.accounts[0].name,a.accounts[0].name);assert.equal(back.company,a.company);assert.equal(back.unrelated,undefined);a=back;}});
test('all-zero refusal remains in unchanged server input checks',()=>{const marker='function checkRequiredInputs';assert.equal(candidate.slice(candidate.indexOf(marker),candidate.indexOf('export function createServer')),base.slice(base.indexOf(marker),base.indexOf('export function createServer')));});


test('reason uses baseline multiplication character without punctuation normalization',()=>{const row=computeAccountPrioritization({accounts:[{name:'Row 1',fit_score:80,intent_signals:60,relationship:40,timing:'now'}]}).scoredAccounts[0];assert.ok(row.reason.includes(String.fromCodePoint(0xd7)));assert.equal(row.reason,ref({accounts:[{name:'Row 1',fit_score:80,intent_signals:60,relationship:40,timing:'now'}]}).scoredAccounts[0].reason);});
