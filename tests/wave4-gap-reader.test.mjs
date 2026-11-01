import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const call=async(name,args)=>{const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
for(const v of verticals)test('R4 '+v+' exclusions do not become targets',async()=>{
 for(const phrase of ['Banks are out of scope','Banks are not for us','We do not sell to banks']){
 const t=await call('icp_gap_analysis',{product_category:v+' vendor',current_customers:'Software firms',ideal_icp:'Software firms. '+phrase});assert.match(t,/Out of scope|Excluded/i);assert.doesNotMatch(t,/\*\*Segments\*\*[^\n]*[Bb]anks/);
 }
 const t=await call('icp_gap_analysis',{product_category:v+' vendor',current_customers:'Software firms',ideal_icp:'Banks are not excluded. Software firms'});assert.doesNotMatch(t,/Out of scope[^\n]*Banks/i);
});
