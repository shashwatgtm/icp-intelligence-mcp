import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const schemas=new Map((await req('tools/list',{})).result.tools.map(t=>[t.name,t.inputSchema]));
const call=async(name,args)=>{const schema=schemas.get(name);assert.ok(schema,'Unknown tool '+name);for(const [k,v]of Object.entries(args)){const field=schema.properties[k];assert.ok(field,'Unknown field '+k);assert.equal(Array.isArray(v)?'array':typeof v,field.type,'Wrong type '+k)}for(const k of schema.required||[])assert.ok(k in args,'Missing '+k);const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
for(const v of verticals)test('API ICP '+v+' seller claims and missing observations stay separate',async()=>{
 const a={product_category:v+' vendor',current_icp:'Finance teams at software firms',time_period:'Last quarter'};
 const empty=await call('icp_evolution_tracker',a);assert.match(empty,/Next Step Plan/);assert.match(empty,/Collect/);
 const data=await call('icp_evolution_tracker',{...a,recent_losses:'Buyer selected an existing provider'});assert.doesNotMatch(data,/Next Step Plan/);
 for(const value of ['Testimonial from a buyer on our website: processing is faster','Quote from a customer on the seller page: processing is faster']){
 const t=await call('icp_interview_synthesizer',{product_category:v+' vendor',interview_notes:[{role:'Finance lead',pain_points:['Manual processing'],value_realized:[value]}]});assert.match(t,/seller claims and testimonials/);assert.doesNotMatch(t,/Seeks outcome: (?:Testimonial|Quote from)/);
 }
 const real=await call('icp_interview_synthesizer',{product_category:v+' vendor',interview_notes:[{role:'Finance lead',pain_points:['Manual processing'],value_realized:['Processing time fell 20% in our pilot']} ]});assert.match(real,/Processing time fell 20/);assert.doesNotMatch(real,/seller claims and testimonials/);
});
