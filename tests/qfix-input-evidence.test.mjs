import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const alpha=existsSync(new URL('../netlify/functions/mcp-sse.js',import.meta.url));
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const rpc=async(method,params={})=> (await (await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}))).json());
const tools=(await rpc('tools/list')).result.tools;
const bases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url)));
const source=new URL(alpha?'../netlify/lib/input-evidence.js':'../src/input-evidence.ts',import.meta.url);
const moduleURL=new URL(alpha?'../netlify/lib/input-evidence.js':'../dist/input-evidence.js',import.meta.url);
const plain=['none','none yet','(none yet)','n/a','na','not applicable','tbd','unknown','not sure','no idea','-','','empty'];
const placeholders=[...new Set(plain.flatMap(v=>[v,v.toUpperCase(),` [${v}] `,`{${v}}!`,`\"${v}\".`,v.replaceAll(' ','...'),v.replaceAll(' ',''),v.split('').join('.')]))];
const denials=['no champion','budget not confirmed','CFO unknown','[NO CHAMPION]!','(Budget not confirmed).','CFO: unknown','we have no champion yet',"budget isn't confirmed",'CFO remains unknown for now','no budget owner has been named','C.F.O. unknown','budget.not.confirmed'];
const text=r=>r.result?.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n')||JSON.stringify(r.error);
const leaves=(schema,path=[])=>{
 if(schema?.type==='string'&&!schema.enum)return [path];
 if(schema?.type==='array')return leaves(schema.items,[...path,0]);
 if(schema?.properties)return Object.entries(schema.properties).flatMap(([k,s])=>leaves(s,[...path,k]));
 return [];
};
const set=(obj,path,value)=>{let p=obj;for(let i=0;i<path.length-1;i++){p[path[i]]??=typeof path[i+1]==='number'?[]:{};p=p[path[i]];}p[path.at(-1)]=value;};
test('RTM39 shared source has its pinned SHA256 and matches available sibling repositories',()=>{
 const expected=readFileSync(new URL('./fixtures/qfix-guard.sha256',import.meta.url),'utf8').trim();
 const hash=url=>createHash('sha256').update(readFileSync(url)).digest('hex');
 assert.equal(hash(source),expected);
 for(const repo of ['icp-intelligence-mcp','impact-mcp','craft-gtm-mcp','craft-content-mcp','revenue-enablement-mcp','gtm-alpha-secure']){
  const peer=new URL(`../../${repo}/${repo==='gtm-alpha-secure'?'netlify/lib/input-evidence.js':'src/input-evidence.ts'}`,import.meta.url);
  if(existsSync(peer))assert.equal(hash(peer),expected,repo);
 }
});
test('RTM39 punctuation, brackets, casing and invisible characters never make a placeholder factual',async()=>{
 const {isPlaceholder,missingEvidence}=await import(moduleURL);
 for(const v of placeholders){assert.equal(isPlaceholder(v),true,JSON.stringify(v));assert.match(missingEvidence({customer_quote:v}),/Missing input: customer quote/);}
 for(const v of ['NoneSuch Labs','Unknown Ventures','NA Analytics','None Yet Incorporated','N/A Solutions','No Idea Consulting','none of our buyers renewed','budget confirmed by Priya','12% pilot reduction'])assert.equal(isPlaceholder(v),false,v);
 assert.equal(isPlaceholder('\u200b[NoNe YeT]\ufeff'),true);
});
test('RTM39 denials do not become authority, names or advocacy',async()=>{
 const {isDenial,missingEvidence}=await import(moduleURL);
 for(const v of denials){assert.equal(isDenial(v),true,v);assert.match(missingEvidence({confirmed_budget_owner:v}),/No budget authority or champion advocacy is confirmed/);}
 for(const v of ['champion confirmed','CFO approved the budget','no delays in budget approval','Priya is champion and introduced the CFO'])assert.equal(isDenial(v),false,v);
});
test('RTM39 supplied object keys cannot introduce an inherited budget owner',async()=>{
 const {guardInputs}=await import(moduleURL);
 const result=guardInputs(JSON.parse('{"__proto__":{"confirmed_budget_owner":"CFO"},"product":"none"}'));
 assert.equal(result.args.confirmed_budget_owner,undefined);
 assert.equal(Object.getPrototypeOf(result.args),Object.prototype);
 assert.match(result.notice,/Missing input: product/);
});
test('RTM04 all absolute claim forms hold copy and specify the evidence needed',async()=>{
 const {copyEvidenceReview}=await import(moduleURL);
 for(const v of ['we stop 100% of attacks','100 percent effective','100.0% effective','100 per cent effective','we guarantee delivery','guaranteed savings','never fails','never-fails','the only solution','only-solution','zero risk','zero-risk','we stop all attacks','all-attacks']){
  const held=copyEvidenceReview('email_sequence_generator',{key_value_prop:v});assert.match(held,/Absolute claim held out/);assert.match(held,/sample, period, limitations and the source/);assert.ok(!held.includes(v));
 }
 assert.equal(copyEvidenceReview('email_sequence_generator',{key_value_prop:'One pilot reduced review time by 12%'}),null);
 assert.equal(copyEvidenceReview('email_sequence_generator',{key_value_prop:'A pilot included 100 customers'}),null);
});
test('RTM04 customer names require affirmative permission for this endorsement',async()=>{
 const {copyEvidenceReview,hasPublicationPermission}=await import(moduleURL);
 for(const qualifier of ['', '; permission not granted','; permission pending','; if we have permission to publish','; permission denied','; we do not have permission to publish','; permission revoked','; we have permission for website use only']){
  assert.match(copyEvidenceReview('email_sequence_generator',{social_proof:'used by JPMorgan'+qualifier}),/Named customer social proof held out/);
 }
 const allowed='used by Acme; we have written permission to publish this endorsement in email';
 assert.equal(hasPublicationPermission(allowed),true);assert.equal(copyEvidenceReview('email_sequence_generator',{social_proof:allowed}),null);
 for(const qualifier of ['permission granted','permission is granted','the customer granted us permission to publish in email'])assert.equal(copyEvidenceReview('email_sequence_generator',{social_proof:'used by Acme; '+qualifier}),null);
 assert.equal(copyEvidenceReview('email_sequence_generator',{social_proof:'Customer quote: "I saved two hours in the pilot."'}),null,'a first person pronoun is not a customer name');
});
test('RTM04 customer names match complete words and technology is not a named customer',async()=>{
 const {holdBuyerCopy,unapprovedCustomerNames}=await import(moduleURL);
 const result=holdBuyerCopy('email_sequence_generator',{social_proof:'used by Wise'},'### Email 1\n\nLikewise, we can discuss your workflow.\n\nOur product is used by Wise.');
 const copy=result.split('## Draft with held statements omitted')[1];
 assert.match(copy,/### Email 1/);assert.match(copy,/Likewise/);assert.doesNotMatch(copy,/\bWise\b/);
 assert.deepEqual(unapprovedCustomerNames({social_proof:'AI saved two hours in the pilot',your_solution:'ReviewMate software'}),[]);
 assert.deepEqual(unapprovedCustomerNames({social_proof:'ReviewMate raised conversion 12%',your_solution:'ReviewMate software'}),[]);
});
let fields=0;
for(const tool of tools){
 const base=bases.find(c=>c.tool===tool.name)?.args||{};
 for(const path of leaves(tool.inputSchema)){
  fields++;
  test(`RTM12 ${tool.name}.${path.join('.')} placeholders`,async()=>{
   for(const value of placeholders){
    const args=structuredClone(base);set(args,path,value);
    const answer=text(await rpc('tools/call',{name:tool.name,arguments:args}));
    assert.match(answer,/Missing (?:required )?input|not supplied/i,JSON.stringify({value,answer}));
    const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
    assert.ok(norm(answer).includes(norm(path.join(''))),`missing field not identified: ${path.join('.')} ${answer}`);
    assert.ok(!/\b(?:Role|Company|Customer|Competitor|In their words)\s*[:.]\s*["(\[]?(?:none(?: yet)?|unknown|tbd|n\/a)\b/i.test(answer),answer);
    assert.ok(!/authority confirmed in your answer/i.test(answer),answer);
   }
  });
  test(`RTM12 ${tool.name}.${path.join('.')} denials`,async()=>{
   for(const value of denials){
    const args=structuredClone(base);set(args,path,value);
    const answer=text(await rpc('tools/call',{name:tool.name,arguments:args}));
    assert.match(answer,/Unconfirmed input:/,answer);
    const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
    assert.ok(norm(answer).includes(norm(path.join(''))),answer);
    assert.match(answer,/No budget authority or champion advocacy is confirmed/);
    assert.doesNotMatch(answer,/authority confirmed in your answer|In their words\.\s*["“]?(?:no champion|budget not confirmed|CFO unknown)/i);
   }
  });
 }
}
test('RTM12 every listed tool with free text has a fixture and field coverage',()=>{
 for(const t of tools.filter(t=>leaves(t.inputSchema).length))assert.ok(bases.find(c=>c.tool===t.name),t.name);
 assert.ok(fields>0);
});
