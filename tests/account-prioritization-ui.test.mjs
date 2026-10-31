import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createServer} from '../src/index.ts';
import {computeAccountPrioritization, accountWidgetResult, ACCOUNT_UI_URI} from '../src/account-prioritization.ts';
const baseRoot=new URL('./fixtures/account-prioritization-runtime/',import.meta.url);fs.mkdirSync(baseRoot,{recursive:true});
fs.copyFileSync(new URL('./fixtures/account-prioritization-baseline.ts',import.meta.url),new URL('index.ts',baseRoot));
for(const f of ['rw-icp.ts','verticals.ts','escape-inputs.ts'])fs.copyFileSync(new URL('../src/'+f,import.meta.url),new URL(f,baseRoot));
const {createServer:createBase}=await import(new URL('index.ts',baseRoot));
async function connection(factory){const server=factory(),client=new Client({name:'local-review',version:'1'});const [a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b);return {client,server};}
const base=await connection(createBase), candidate=await connection(createServer);
const call=(c,args)=>c.client.callTool({name:'account_prioritization',arguments:structuredClone(args)});
const rows=[{name:'Row 1',fit_score:80,intent_signals:60,relationship:40,timing:'now'},{name:'Row 2',fit_score:40,intent_signals:50,relationship:50,timing:'soon'}];
test('nine tools and unchanged metadata except one additive resource',async()=>{const a=await base.client.listTools(),b=await candidate.client.listTools();assert.equal(a.tools.length,9);assert.equal(b.tools.length,9);const selected=b.tools.find(t=>t.name==='account_prioritization');assert.equal(selected._meta.ui.resourceUri,ACCOUNT_UI_URI);delete selected._meta;assert.deepEqual(b,a);});
test('resource MIME, source consistency and empty CSP',async()=>{const list=await candidate.client.listResources();assert.equal(list.resources.length,1);const r=await candidate.client.readResource({uri:ACCOUNT_UI_URI});assert.equal(r.contents[0].mimeType,'text/html;profile=mcp-app');assert.equal(r.contents[0].text,fs.readFileSync(new URL('../ui/account-prioritization.html',import.meta.url),'utf8'));assert.deepEqual(r.contents[0]._meta.ui.csp,{connectDomains:[],resourceDomains:[],frameDomains:[]});});
const fixtures=[
['empty',{}],['ordinary',{accounts:rows}],['changed',{accounts:[{...rows[0],fit_score:20}]}],
['defaults',{accounts:[{name:'Row 1'}]}],['zeros',{accounts:[{name:'Row 1',fit_score:0,intent_signals:0,relationship:0,timing:'later'}],prioritization_weights:{fit:0,intent:0,relationship:0,timing:100}}],
['all zero weights',{accounts:rows,prioritization_weights:{fit:0,intent:0,relationship:0,timing:0}}],
['weights200',{accounts:rows,prioritization_weights:{fit:80,intent:60,relationship:30,timing:30}}],
['fractional',{accounts:rows,prioritization_weights:{fit:33.3,intent:33.3,relationship:33.3,timing:.1}}],
['unknown timing',{accounts:[{name:'Row 1',timing:' now '},{name:'Row 2',timing:'NOW'},{name:'Row 3',timing:'unexpected'}]}],
['duplicates and ties',{accounts:[{name:'Same'},{name:'Same'},{name:'Same'}]}],
['seven rows',{accounts:Array.from({length:7},(_,i)=>({name:'Row '+(i+1),fit_score:90-i,intent_signals:60,relationship:40,timing:'now'}))}],
['negative weights',{accounts:rows,prioritization_weights:{fit:-40,intent:60,relationship:30,timing:30}}],
['overflow',{accounts:rows,prioritization_weights:{fit:1e308,intent:1e308,relationship:1e308,timing:1e308}}],
['null fields',{accounts:[{name:'Row 1',fit_score:null,intent_signals:null,relationship:null,timing:null}],prioritization_weights:{fit:null}}],
['numeric strings',{accounts:[{name:'Row 1',fit_score:'80',intent_signals:'60',relationship:'40',timing:'now'}],prioritization_weights:{fit:'40'}}],
['invalid score',{accounts:[{name:'Row 1',fit_score:101}]}],
['literal markup',{accounts:[{name:'<img src=x onerror=alert(1)> & \\ \" é',timing:'<script>now</script>'}],company:'<&>',product_category:'<&>'}]
];
for(const [name,args]of fixtures)test('legacy differential: '+name,async()=>{const a=await call(base,args),b=await call(candidate,args);assert.deepEqual(b.content,a.content);assert.equal(b.isError,a.isError);if(!b.isError){assert.equal(b.structuredContent.textFallback,b.content[0].text);assert.equal(b.structuredContent.tool,'account_prioritization');}});
test('independent arithmetic and defaults',async()=>{const r=(await call(candidate,{accounts:rows})).structuredContent.result;assert.equal(r.accounts[0].total,71);assert.equal(r.accounts[0].tier,'B');assert.equal(r.accounts[1].total,49);assert.deepEqual(r.accounts[0].contributions,{fit:32,intent:18,relationship:6,timing:15});assert.deepEqual(r.cutoffs,{A:80,B:60,C:40});const d=(await call(candidate,{accounts:[{name:'Row'}]})).structuredContent.result.accounts[0];assert.equal(d.total,50);assert.deepEqual(d.defaults,['fit','intent','relationship','timing']);});
test('stable ids, duplicate names, ties and first-five actions',async()=>{const r=(await call(candidate,{accounts:Array.from({length:7},()=>({name:'Same'}))})).structuredContent.result.accounts;assert.deepEqual(r.map(a=>a.inputIndex),[0,1,2,3,4,5,6]);assert.equal(new Set(r.map(a=>a.id)).size,7);assert.equal(r[5].nextAction,null);assert.equal(r[6].reason,null);});
test('overflow is qualified in additive result without changing accepted legacy text',async()=>{const r=await call(candidate,fixtures.find(x=>x[0]==='overflow')[1]);assert.equal(r.structuredContent.result.rangeSupported,false);assert.equal(r.structuredContent.result.maximum,null);assert.ok(r.structuredContent.warnings.some(w=>w.code==='range'));});
test('negative-weight server behavior preserved and UI warning explicit',async()=>{const r=await call(candidate,fixtures.find(x=>x[0]==='negative weights')[1]);assert.ok(r.structuredContent.warnings.some(w=>w.code==='weights'));});
test('literal allowlist preserves repeated edits and excludes unknown fields',async()=>{let args={accounts:[{name:'A & <B> \" \\ é',timing:' now ',fit_score:0}],company:'<context>',product_category:'A&B',unrelated:'not part of widget'};for(let i=0;i<3;i++){const r=await call(candidate,args);const decoded=JSON.parse(Buffer.from(r._meta.helixAccountPrioritization.inputsBase64,'base64').toString('utf8'));assert.equal(decoded.accounts[0].name,args.accounts[0].name);assert.equal(decoded.company,args.company);assert.equal(decoded.unrelated,undefined);assert.equal(r.structuredContent.input.company, String.raw`\<context\>`);args=decoded;}});
test.after(async()=>{await base.client.close();await base.server.close();await candidate.client.close();await candidate.server.close();});

